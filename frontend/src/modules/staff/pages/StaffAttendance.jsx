import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Check, X, Coffee, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useGetActiveStaffQuery, useGetAttendanceByDateQuery, useCreateOrUpdateAttendanceMutation } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

export default function StaffAttendance() {
  const navigate = useNavigate();
  
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getStaffLabels(language);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});

  const { data: staffData, isLoading: staffLoading } = useGetActiveStaffQuery();
  const { data: existingAttendance, isLoading: attendanceLoading } = useGetAttendanceByDateQuery(selectedDate);
  const [saveAttendance] = useCreateOrUpdateAttendanceMutation();

  const staff = staffData?.data || [];

  // Pre-fill attendance data when existing attendance is loaded
  useEffect(() => {
    if (existingAttendance?.data?.attendance) {
      const mappedData = {};
      existingAttendance.data.attendance.forEach(att => {
        if (att.staff) {
          mappedData[att.staff._id] = {
            status: att.status,
            lateHours: att.lateHours || 0
          };
        }
      });
      setAttendanceData(mappedData);
    }
  }, [existingAttendance]);

  // Handle status change for a staff member
  const handleStatusChange = async (staffId, status, lateHours = 0) => {
    setAttendanceData(prev => ({
      ...prev,
      [staffId]: { status, lateHours }
    }));
    
    // Auto-save for all statuses except 'late' (late requires manual submit)
    if (status !== 'late') {
      await saveAttendanceRecord(staffId, status, lateHours);
    }
  };

  // Handle late hours change
  const handleLateHoursChange = (staffId, hours) => {
    setAttendanceData(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], lateHours: parseFloat(hours) || 0 }
    }));
  };

  // Handle manual submit for late status
  const handleLateSubmit = async (staffId) => {
    const attendance = attendanceData[staffId];
    if (attendance && attendance.status === 'late') {
      await saveAttendanceRecord(staffId, 'late', attendance.lateHours);
    }
  };

  // Save attendance record
  const saveAttendanceRecord = async (staffId, status, lateHours) => {
    try {
      console.log('Saving attendance for staff:', staffId, 'status:', status, 'date:', selectedDate);
      
      if (!staffId) {
        toast.error("Staff ID is missing");
        return;
      }

      await saveAttendance({
        date: selectedDate,
        staff: staffId,
        status,
        lateHours
      }).unwrap();
      toast.success(labels.attendanceMarked);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(labels.failedToSave || "Failed to save attendance");
      // Revert on error
      setAttendanceData(prev => {
        const newState = { ...prev };
        delete newState[staffId];
        return newState;
      });
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'present':
        return { icon: Check, color: 'bg-green-500', label: labels.present };
      case 'absent':
        return { icon: X, color: 'bg-red-500', label: labels.absent };
      case 'leave':
        return { icon: Coffee, color: 'bg-yellow-500', label: labels.leave };
      case 'late':
        return { icon: AlertCircle, color: 'bg-orange-500', label: labels.late };
      default:
        return { icon: Clock, color: 'bg-gray-400', label: 'Not Marked' };
    }
  };

  return (
    <div className="p-6 bg-[var(--app-bg)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/staff")}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--ink)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.markAttendance}</h1>
            <p className="text-sm text-[var(--muted)]">{labels.manageStaff}</p>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="card mb-6 p-4">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-[var(--muted)]" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.attendanceDate}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
            />
          </div>
        </div>
      </div>

      {/* Staff Cards */}
      {staffLoading || attendanceLoading ? (
        <div className="card p-8 text-center text-[var(--muted)]">{labels.loading}</div>
      ) : staff.length === 0 ? (
        <div className="card p-8 text-center text-[var(--muted)]">{labels.noStaffFound}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((staffMember) => {
            const attendance = attendanceData[staffMember._id] || { status: null, lateHours: 0 };
            const statusInfo = getStatusInfo(attendance.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={staffMember._id} className="card p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--ink)]">{staffMember.fullName}</h3>
                    <p className="text-sm text-[var(--muted)]">{staffMember.role}</p>
                    <p className="text-xs text-[var(--muted)]">{staffMember.phone}</p>
                  </div>
                  {attendance.status && (
                    <div className={`p-2 rounded-full ${statusInfo.color}`}>
                      <StatusIcon size={16} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4">
                  <button
                    onClick={() => handleStatusChange(staffMember._id, 'present')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      attendance.status === 'present'
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--app-bg)] border border-[var(--border)] hover:bg-green-50'
                    }`}
                  >
                    {labels.present}
                  </button>
                  <button
                    onClick={() => handleStatusChange(staffMember._id, 'absent')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      attendance.status === 'absent'
                        ? 'bg-red-500 text-white'
                        : 'bg-[var(--app-bg)] border border-[var(--border)] hover:bg-red-50'
                    }`}
                  >
                    {labels.absent}
                  </button>
                  <button
                    onClick={() => handleStatusChange(staffMember._id, 'leave')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      attendance.status === 'leave'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-[var(--app-bg)] border border-[var(--border)] hover:bg-yellow-50'
                    }`}
                  >
                    {labels.leave}
                  </button>
                  <button
                    onClick={() => handleStatusChange(staffMember._id, 'late')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      attendance.status === 'late'
                        ? 'bg-orange-500 text-white'
                        : 'bg-[var(--app-bg)] border border-[var(--border)] hover:bg-orange-50'
                    }`}
                  >
                    {labels.late}
                  </button>
                </div>

                {/* Late Hours Input */}
                {attendance.status === 'late' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Clock size={16} className="text-[var(--muted)]" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Hours late"
                      value={attendance.lateHours}
                      onChange={(e) => handleLateHoursChange(staffMember._id, e.target.value)}
                      className="flex-1 min-w-[80px] px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                    />
                    <span className="text-sm text-[var(--muted)]">hours</span>
                    <button
                      onClick={() => handleLateSubmit(staffMember._id)}
                      className="p-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/80 transition-colors flex-shrink-0"
                      title="Submit"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
