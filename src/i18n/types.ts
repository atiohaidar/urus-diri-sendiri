export type Language = 'en' | 'id';

export interface Translation {
    common: {
        loading: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        back: string;
    };
    checkin: {
        title: string;
        subtitle: string;
        win_of_day: string;
        win_placeholder: string;
        hurdle: string;
        hurdle_placeholder: string;
        priorities: string;
        priority_1_placeholder: string;
        priority_2_placeholder: string;
        priority_3_placeholder: string;
        small_change: string;
        small_change_placeholder: string;
        save: string;
        save_toast_title: string;
        save_toast_desc: string;
    };
    navigation: {
        home: string;
        ideas: string;
        history: string;
        settings: string;
    };
    history: {
        title: string;
        subtitle: string;
        no_reflections_title: string;
        no_reflections_desc: string;
        win_of_day: string;
        hurdle: string;
        priorities_set: string;
        small_change: string;
        evening_reflection: string;
    };
    settings: {
        title: string;
        language: string;
        theme: string;
        dark_mode: string;
        light_mode: string;
        system: string;
        data_management: string;
        backup_title: string;
        backup_desc: string;
        restore_title: string;
        restore_desc: string;
        backup_success: string;
        backup_error: string;
        import_success: string;
        import_error: string;
    };
}
