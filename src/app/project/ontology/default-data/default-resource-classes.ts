import { Constants } from '@dasch-swiss/dsp-js';

export interface DefaultInfo {
    iri: string;
    label: string;
    icons?: string[];   // icons can be used to be selected in the resource class form
}

export class DefaultResourceClasses {

    public static data: DefaultInfo[] = [
        {
            iri: Constants.Resource,
            label: 'Object without file representation (metadata only)',
            icons: [
                'person',
                'person_outline',
                'group',
                'groups',
                'people_alt',
                'note',
                'notes',
                'text_snippet',
                'short_text',
                'comment',
                'event_note',
                'emoji_symbols',
                'calculate',
                'functions',
                'house',
                'location_city',
                'science',
                'school',
                'emoji_transportation',
                'local_bar',
                'fastfood',
                'restaurant',
                'collections',
                'portrait',
                'auto_stories',
                'book',
                'import_contacts',
                'menu_book',
                'commute',
                'map',
                'satellite',
                'public',
                'language',
                'devices',
                'devices_other',
                'important_devices',
                'source'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageRepresentation',
            label: 'Still Image',
            icons: [
                'photo',
                'panorama',
                'photo_library',
                'camera_roll',
                'camera',
                'camera_alt',
                'camera_enhance',
                'portrait',
                'auto_stories',
                'book',
                'import_contacts',
                'menu_book',
                'note',
                'sticky_note_2',
                'account_balance',
                'museum',
                'theater_comedy',
                'landscape',
                'nature_people',
                'screenshot',
                'wallpaper'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'MovingImageRepresentation',
            label: 'Moving Image',
            icons: [
                'movie',
                'theaters',
                'slideshow',
                'live_tv',
                'animation',
                'music_video',
                'play_circle_filled',
                'play_circle_outline',
                'videocam',
                'video_library',
                'duo',
                'subtitles'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'AudioRepresentation',
            label: 'Audio',
            icons: [
                'audiotrack',
                'music_note',
                'graphiq_eq',
                'headphones',
                'volume_up',
                'mic',
                'equalizer',
                'speaker',
                'album',
                'voicemail',
                'music_video',
                'library_music',
                'radio'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'TextRepresentation',
            label: 'Text',
            icons: [
                'rtt',
                'notes',
                'subject',
                'chrome_reader_mode'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'DocumentRepresentation',
            label: 'Document (Word, PDF, etc.)',
            icons: [
                'description',
                'article',
                'text_snippet',
                'picture_as_pdf',
                'mark_as_unread',
                'history_edu',
                'mail',
                'drafts',
                'library_books'
            ]
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'DDDRepresentation',
            label: 'RTI Image',
            icons: [
                'view_in_ar',
                'layers'
            ]
        }
    ];

}
