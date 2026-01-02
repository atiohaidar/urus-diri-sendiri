import { forwardRef } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Re-export properties for type safety if needed usually ReactQuill types are enough
export type EditorProps = ReactQuillProps;

// Wrap ReactQuill to be lazy loaded
const LazyEditor = forwardRef<ReactQuill, EditorProps>((props, ref) => {
    return (
        <ReactQuill
            {...props}
            ref={ref}
            theme="snow"
        />
    );
});

LazyEditor.displayName = "LazyEditor";

export default LazyEditor;
