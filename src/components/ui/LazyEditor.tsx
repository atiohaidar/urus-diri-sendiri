import { ComponentProps, forwardRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Re-export properties for type safety using ComponentProps
export type EditorProps = ComponentProps<typeof ReactQuill>;

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
