export type FormBlockType =
  | 'RowLayout'
  | 'RadioSelect'
  | 'InputText'
  | 'TextArea'
  | 'Heading'
  | 'Paragraph'
  | 'SelectOption'
  | 'InputNumber'
  | 'EditorText'
  | 'DatePicker'
  | 'CheckBox'
  | 'TimePicker'
  | 'RangePicker'
  | 'Signature'
  | 'Uploader'
  | 'Link'
  | 'EditorDescription';

export type FormBlockInstance = {
  id: string;
  blockType: FormBlockType;
  attributes?: Record<string, unknown>;
  isLocked?: boolean;
  childBlock?: FormBlockInstance[];
};
