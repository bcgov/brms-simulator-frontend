export type Submission = {
  submissionId: string;
  createdBy: string;
  createdAt: string;
  submission: {
    data: SubmissionData;
  };
};

export type SubmissionData = Record<string, any>;
