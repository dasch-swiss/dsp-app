import { Constants } from '@dasch-swiss/dsp-js';

export interface DefaultClass {
    iri: string;
    label: string;
    icons?: string[]; // icons can be used to be selected in the resource class form
}

export class DefaultResourceClasses {
    public static data: DefaultClass[] = [
        {
            iri: Constants.Resource,
            label: 'Object without representation',
            icons: [
                'person_outline',
                'person',
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
                'source',
            ],
        },
        {
            iri: Constants.StillImageRepresentation,
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
                'wallpaper',
            ],
        },
        {
            iri: Constants.MovingImageRepresentation,
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
                'subtitles',
            ],
        },
        {
            iri: Constants.AudioRepresentation,
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
                'radio',
            ],
        },
        {
            iri: Constants.TextRepresentation,
            label: 'Text',
            icons: ['rtt', 'notes', 'subject', 'chrome_reader_mode'],
        },
        {
            iri: Constants.DocumentRepresentation,
            label: 'Document',
            icons: [
                'description',
                'article',
                'text_snippet',
                'picture_as_pdf',
                'mark_as_unread',
                'history_edu',
                'mail',
                'drafts',
                'library_books',
            ],
        },
        {
            iri: Constants.ArchiveRepresentation,
            label: 'Archive',
            icons: ['archive', 'folder', 'folder_open'],
        },
    ];
}

/* --> DSP-1559: disable RTI class;
    the following object can be added again to the default classes as soon as a RTI viewer is implemented
    {
        iri: Constants.DDDRepresentation,
        label: 'RTI Image',
        icons: [
            'view_in_ar',
            'layers'
        ]
    }
*/
