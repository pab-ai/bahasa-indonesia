export type Category='Grammar'|'Vocabulary'|'Conversation'|'Phrases'|'Numbers';
export type Concept={id:string;title:string;description:string;category:Category;difficulty:1|2|3;sources:string[];examples:string[];mastery:number;status:'approved'|'review'};
export type QuestionType='multiple_choice'|'translation'|'word_order'|'dialogue'|'situation'|'true_false'|'fill_blank';
export type Question={id:string;conceptId:string;type:QuestionType;prompt:string;context?:string;choices:string[];answers:string[];explanation:string;difficulty:1|2|3};
export type Attempt={questionId:string;conceptId:string;correct:boolean;responseMs:number;at:string};
