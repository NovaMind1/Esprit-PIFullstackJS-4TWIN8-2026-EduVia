export type LevelAssessmentAnswerDto = {
  questionId: string;
  selectedOptionId: string;
};

export type SubmitLevelAssessmentDto = {
  email?: string;
  answers: LevelAssessmentAnswerDto[];
};
