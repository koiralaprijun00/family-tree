export interface Festival {
  name: string;
  clues: string[];
  fact: string;
  image: string;
  question: string;
}

export interface GKQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  fact: string;
  image: string;
  category: string;
}