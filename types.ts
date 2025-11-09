export enum EvaluationLevel {
  Primary = 'PRIMARY',
  HighSchool = 'HIGH_SCHOOL',
}

export enum PrimaryRating {
  Never = 'NEVER',
  Sometimes = 'SOMETIMES',
  Always = 'ALWAYS',
}

export type HighSchoolRating = 1 | 2 | 3 | 4;

export interface Subject {
  id: string;
  name: string;
  iconId?: string;
  iconUrl?: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface TeachingAssignment {
  teacherId: string;
  subjectId: string;
}

export interface Grade {
  id: number;
  name: string;
  level: EvaluationLevel;
  assignments: TeachingAssignment[];
}

export type Answer = PrimaryRating | HighSchoolRating;

export interface Evaluation {
  id: string;
  studentName: string;
  gradeId: number;
  teacherId: string;
  subjectId: string;
  answers: Answer[];
  timestamp: number;
}

export interface EvaluationTarget {
  grade: Grade;
  teacher: Teacher;
  subject: Subject;
}

export interface ChartData {
  question: string;
  score: number;
  fullQuestion?: string;
}

// Supabase DB Schema types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: {
          grade_id: number | null
          id: number
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          grade_id?: number | null
          id?: number
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          grade_id?: number | null
          id?: number
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          answers: Json
          grade_id: number | null
          id: string
          student_name: string
          subject_id: string | null
          teacher_id: string | null
          timestamp: string
        }
        Insert: {
          answers: Json
          grade_id?: number | null
          id?: string
          student_name: string
          subject_id?: string | null
          teacher_id?: string | null
          timestamp?: string
        }
        Update: {
          answers?: Json
          grade_id?: number | null
          id?: string
          student_name?: string
          subject_id?: string | null
          teacher_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          id: number
          level: string
          name: string
        }
        Insert: {
          id: number
          level: string
          name: string
        }
        Update: {
          id?: number
          level?: string
          name?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: number
          level: string
          order: number
          text: string
        }
        Insert: {
          id?: number
          level: string
          order: number
          text: string
        }
        Update: {
          id?: number
          level?: string
          order?: number
          text?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: Json | null
        }
        Insert: {
          key: string
          value?: Json | null
        }
        Update: {
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          iconId: string | null
          iconUrl: string | null
          id: string
          name: string
        }
        Insert: {
          iconId?: string | null
          iconUrl?: string | null
          id: string
          name: string
        }
        Update: {
          iconId?: string | null
          iconUrl?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
