from pathlib import Path

path = Path(__file__).resolve().parent.parent / 'frontend' / 'src' / 'features' / 'class' / 'parts' / 'EachClassDataComp.jsx'
text = path.read_text(encoding='utf-8')
start = text.index('                {/* --- MAIN CONTENT AREA --- */}')
end = text.index('                </main>', start) + len('                </main>')
new_block = '''                {/* --- MAIN CONTENT AREA --- */}
                <main className="flex-1 overflow-y-auto space-y-5 bg-[#FDFDFD] p-6 md:p-14 custom-scrollbar">
                    <div className="rounded-3xl p-6 bg-white shadow-sm border border-slate-200">
                        <div className="flex flex-wrap gap-3 mb-6">
                            {[
                                { id: 'students', label: 'Students' },
                                { id: 'subjects', label: 'Subjects' },
                                { id: 'exams', label: 'Exams' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition ${activeTab === tab.id ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'students' && (
                            <ClassStudentSection
                                classData={classData}
                                onViewStudent={(studentId) => { setStudentDataVisibility(true); setCurrentCLickedStudentId(studentId) }}
                                onCreateStudent={() => setStudentCreateVisibility(true)}
                                onPromoteAll={() => setClassPromotionContainerVisiblity(true)}
                            />
                        )}

                        {activeTab === 'subjects' && (
                            <PermissionGuard permission="class-subject-view">
                                <ClassSubjectSection
                                    classData={classData}
                                    onCreateSubject={() => setSubjectCreationFormVisibility(true)}
                                    onPreviewSubject={(sub) => { setSubjectContentpreview(true); setCurrentClickedSubject(sub) }}
                                    onEditSubject={(sub) => { setCurrentToUpdateSubjectData(sub); setEditSubjectFormVisible(true) }}
                                    onDeleteSubject={async (subjectId) => await subjectDeleteTanstackMutation({ subjectId, classId }).unwrap()}
                                />
                            </PermissionGuard>
                        )}

                        {activeTab === 'exams' && (
                            <PermissionGuard permission="class-exam-view">
                                <ClassExamSection
                                    classData={classData}
                                    examFilterType={examFilterType}
                                    onFilterChange={(value) => setExamFilterType(value)}
                                    onCreateExam={() => setExamCreationFormVisibility(true)}
                                    onEditExam={(exam) => { setCurrentToUpdateExamData(exam); setExamUpdateFormVisibility(true) }}
                                    onViewExam={(exam) => { setCurrentExamToView(exam); setExamDetailVisibility(true) }}
                                    onDeleteExam={async (examId) => await examDeleteMutation({ classId, examId }).unwrap()}
                                />
                            </PermissionGuard>
                        )}
                    </div>

                    {currentExamToView && <ExamDetailTable visibility={examDetailVisibility} setVisibility={setExamDetailVisibility} exam={currentExamToView} students={classData?.enrolledStudents || []} />}

                    <style jsx>{`\n  .custom-scrollbar::-webkit-scrollbar {\n    width: 4px;\n  }\n  .custom-scrollbar::-webkit-scrollbar-track {\n    background: transparent;\n  }\n  .custom-scrollbar::-webkit-scrollbar-thumb {\n    background: #e2e8f0;\n    border-radius: 10px;\n  }\n`}</style>
                </main>'''
path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
print('updated main block', path)
