 /* eslint-disable */
              import { HTMLAttributes, DetailedHTMLProps } from 'react';
              
          import { CxIcon, CxIconButton, CxAlert, CxAnimatedImage, CxAnimation, CxAvatar, CxBadge, CxBreadcrumbItem, CxBreadcrumb, CxPopup, CxSpinner, CxMenuItem, CxInput, CxMenu, CxTextarea, CxDropdown, CxButton, CxButtonGroup, CxCard, CxCarouselItem, CxCarousel, CxCheckbox, CxDivider, CxMarkdown, CxTooltip, CxTypography, CxChatbot, CxVisuallyHidden, CxColorPicker, CxCopyButton, CxDetails, CxDialog, CxDrawer, CxElementClamp, CxResizeObserver, CxLineClamp, CxTreeItem, CxTree, CxFormatBytes, CxOption, CxProgressBar, CxRelativeTime, CxTag, CxSelect, CxSpace, CxTab, CxTabPanel, CxTabGroup, CxConfirmPopover, CxFileOnDemand, CxFormatDate, CxFormatNumber, CxGrid, CxGridItem, CxHeader, CxHubConnection, CxImageComparer, CxSkeleton, CxImage, CxInclude, CxInputGroup, CxMasonry, CxMenuLabel, CxMenuSection, CxMutationObserver, CxPagination, CxProgressRing, CxQrCode, CxRadio, CxRadioButton, CxRadioCard, CxRadioGroup, CxRange, CxRating, CxSplitPanel, CxStep, CxStepper, CxSwitch, CxVideo, CxSidebarLayout, CxBicolorPicker, CxBorderInputGroup, CxColorSwatch, CxCropper, CxFolderSelect, CxGraphView, CxPaddingInputGroup, CxShadowInputGroup, CxSidebar, CxStepperWizard, CxStorybook, CxAssetLinkFormat, CxClusterManagement, CxColorSwatchGroup, CxComment, CxRteCodeBlockToolbar, CxColumn, CxColumnGroup, CxText, CxContentBuilder, CxDownloader, CxMultiSelect, CxTemplateSwitcher, CxTextToSpeech, CxVideoEditor } from './web-component';
        
              
            export type CxInputRecord = {  };
            export type CxMarkdownRendererObject = {  };
            export type CxChatbotChatbotEvent = { event: string; excludedFromPurposes: string[]; label: string; };
            export type CxFileOnDemandAssetsProp = { assets: CxFileOnDemandAsset[]; hasMore: boolean; };
            export type CxFileOnDemandAsset = { docType: string; fileName: string; isInFavorite: boolean; isPaused: boolean; isUploadCompleted: boolean; key: string; parentRecordId: string; recordId: string; remainingSize: number; remainingTime: number; size: number; thumbnail: string; uploadId: string; uploadStatus: 'CANCELED' | 'FAILED' | 'INPROGRESS' | 'PENDINGCOMPLETE' | 'SUCCESS'; uploadTimestamp: number; uploaded: number; };
            export type CxFileOnDemandSettings = { cacheLocation: string; cacheSize: number; config: { monitoringActivated: boolean; mountPoint: string; mountProxy: boolean; proxyTypes: 'Image' | 'Video' | 'Audio'[]; rootIDs: string[]; siteUrl: string; version: string; }; };
            export type CxMasonryMasonryItem = { alt: string; id: string; objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'; src: string; };
            export type CxMasonryMasonryItemAction = { color: string; event: string; icon: string; tooltip: string; };
            export type CxGraphViewWorkflow = { data: CxGraphViewData; description: string; id: string; links: CxGraphViewEdge[]; name: string; node_types: CxGraphViewRecord; nodes: CxGraphViewNode[]; type: string; };
            export type CxGraphViewData = { fromTransition: string; name: string; source: string; transitions: CxGraphViewTransition[]; };
            export type CxGraphViewTransition = { description: string; icon: string; icon_rotation: number; id: string; name: string; required: boolean; type: string; };
            export type CxGraphViewEdge = { fromNode: string; fromTransition: string; icon: string; iconRotation: number; toNode: string; };
            export type CxGraphViewRecord = dictionary;
            export type CxGraphViewNodeType = { allows_loop: boolean; color: string; icon: string; name: string; };
            export type CxGraphViewNode = { avatarUrl: string; border: boolean; borderColor: string; category: string; color: string; data: CxGraphViewData; description: string; icon: string; id: string; messages: string[]; name: string; showDivider: boolean; state: 'Error'; styles: CxGraphViewRecord; summaries: CxGraphViewSummary[]; type: 'Action' | 'Decision' | 'Status' | 'Trigger' | 'Agent' | 'Ghost'; unordered: boolean; unorderedText: string; };
            export type CxGraphViewSummary = { icon: string; texts: string[]; };
            export type CxStepperWizardStepData = { color: string; description: string; icon: string; iconVariant: 'outlined' | 'filled' | 'fa'; id: string; name: string; readonly: boolean; state: 'Done' | 'Active' | 'None' | 'Disabled'; };
            export type CxStorybookRecord = {  };
            export type CxAssetLinkFormatAsset = { allowATSLink: boolean; docSubType: string; docType: 'Album' | 'Audio' | 'Image' | 'Multimedia' | 'Story' | 'Video' | 'Widget'; extension: string; height: string; id: string; identifier: string; imageUrl: string; name: string; originalUrl: string; scrubUrl: string; size: string; tags: string; width: string; };
            export type CxAssetLinkFormatProxy = { cdnName: string; extension: string; formatHeight: number; formatWidth: number; height: number; id: string; permanentLink: string; proxyLabel: string; proxyName: string; width: number; };
            export type CxAssetLinkFormatTransformation = { key: 'Crop' | 'Metadata' | 'Proxy' | 'Quality' | 'Resize' | 'Rotate'; value: { height: number; keepMetadata: boolean; quality: number; rotation: number; unit: 'aspect-ratio' | 'pixels'; width: number; x: number; y: number; }; };
            export type CxColorSwatchGroupColorSwatchData = { cmyk: string; hex: string; name: string; pms: string; rgb: string; };
            export type CxContentBuilderDevice = { canvasWidth: string; height: string; id: string; maxWidth: string; name: string; };
            export type CxDownloaderExecutionContext = { defaultDownloadFolder: CxDownloaderRaw; downloadRequestedEvent: CxDownloaderEvent; instructionsURL: CxDownloaderRaw; isReady: CxDownloaderRaw; locationPickedEvent: CxDownloaderEvent; locationRequestedEvent: CxDownloaderEvent; openDirectoryPickerAction: CxDownloaderAction; openDownloaderEvent: CxDownloaderEvent; promptAction: CxDownloaderAction; promptRepliedEvent: CxDownloaderEvent; configurationData: CxDownloaderConfigurationData; };
            export type CxDownloaderRaw = { value: string; };
            export type CxDownloaderEvent = {  };
            export type CxDownloaderAction = { doNothing: boolean; };
            export type CxDownloaderConfigurationData = { allowForcedDownloadLocation: boolean; autoUnlockAfterMinutes: number; backgroundJobDefaultInterval: number; chunkSize: number; dateFormat: string; defaultMode: 'normal' | 'rocket'; downloadChunkMaxRetries: number; downloadChunkRetryMaxWait: number; downloadChunkRetryMinWait: number; downloadDirectlyFromCloudIfPossible: boolean; downloadSpeedMonitorDuration: number; instructionsPopupHeight: number; instructionsPopupWidth: number; massActionBatchSize: number; maxChunkSize: number; maxRetryPerChunk: number; minChunkSize: number; missingFileErrorMessage: string; networkErrorMessage: string; normalMode: { backgroundJobInstancesCount: CxDownloaderRecord; backgroundJobInterval: CxDownloaderRecord; maxInProgressChunksPerFile: number; }; notEnoughStorageErrorMessage: string; popupId: string; rocketMode: { backgroundJobInstancesCount: CxDownloaderRecord; backgroundJobInterval: CxDownloaderRecord; maxInProgressChunksPerFile: number; }; roundRobinCloudURLs: boolean; shouldHandlePathLimit: boolean; verbose: boolean; };
            export type CxDownloaderRecord = dictionary;
            export type CxMultiSelectColumnData = { id: string; items: { group: string; id: string; index: string; text: string; tooltip: string; type: string; }[]; sort: boolean; title: string; };
            export type CxTemplateSwitcherTemplateSwitcherProps = { VFormID: string; categories: CxTemplateSwitcherCategory[]; defaultDirectionWhenSortChange: string; defaultSettings: CxTemplateSwitcherSettings; defaultSortForResequence: string; disabledCountForViews: string[]; disabledDeployStackForViews: string[]; disabledGroupByForViews: string[]; disabledSeeThruForViews: string[]; disabledSortForViews: string[]; events: CxTemplateSwitcherEvents; forceSortOrderWhenSeethruOff: string; groupBy: CxTemplateSwitcherOption[]; hideDeployStackForViews: string[]; hideGroupByForViews: string[]; initSettings: CxTemplateSwitcherSettings; itemsPerPage: CxTemplateSwitcherOption[]; moreOptions: CxTemplateSwitcherMoreOptions; sections: CxTemplateSwitcherSectionOption[]; sortOrder: CxTemplateSwitcherSortOrder[]; view: CxTemplateSwitcherOption[]; };
            export type CxTemplateSwitcherCategory = { id: string; name: string; };
            export type CxTemplateSwitcherSettings = { darkMode: boolean; deployStack: boolean; direction: string; groupBy: string; itemsPerPage: string; resequence: boolean; seeThru: boolean; showBinnedAssets: boolean; sortOrder: string; view: string; };
            export type CxTemplateSwitcherEvents = dictionary;
            export type CxTemplateSwitcherEventOption = { delay: string; returnType: string; };
            export type CxTemplateSwitcherOption = { category: string; eventName: string; id: string; isSetting: boolean; name: string; selectedTip: string; subCategory: string; unselectedTip: string; };
            export type CxTemplateSwitcherMoreOptions = dictionary;
            export type CxTemplateSwitcherSectionOption = { id: string; name: string; };
            export type CxTemplateSwitcherSortOrder = { category: string; eventName: string; id: string; isSetting: boolean; name: string; selectedTip: string; subCategory: string; unselectedTip: string; direction: CxTemplateSwitcherOption[]; };
            export type CxTextToSpeechTextToSpeechData = { HtmlData: string; SsmlData: { LanguageCode: string; Name: string; SsmlText: string; }; };
            export type CxVideoEditorPartial = { captionsURI: CxVideoEditorCaption; crop: { height: number; width: number; x: number; y: number; }; frameRate: number; label: string; muted: boolean; playbackSpeed: number; recordID: string; rotation: number; scrubMIME: string; scrubURL: string; sourceMIME: string; sourceURL: string; startPosition: number; stopPosition: number; volume: number; vrMode: string; };
            export type CxVideoEditorCaption = dictionary;
            export type CxVideoEditorTransition = { backgroundColor: string; duration: string; subClipId: string; };
            export type CxVideoEditorRatio = { description: string; height: number; label: string; width: number; };
               
            /**
              * @summary Icons are symbols that can be used to represent various options within an application.
 * 
 *  https://fonts.google.com/icons
 * 
 *  @csspart span - The internal span element.
            */
            interface CxIconAttributes extends HTMLAttributes<CxIcon> {
              
        /**
          * The name of the icon to draw. Available names depend on the icon library being used.
        */
        name?: string;
        /**
          * The src of the icon for custom icons.
        */
        src?: string;
        /**
          * An alternate description to use for assistive devices. If omitted, the icon will be considered presentational and
 *  ignored by assistive devices.
        */
        label?: string;
        /**
          * The variant of the icon to draw.
        */
        variant?: 'outlined' | 'filled' | 'round' | 'sharp' | 'two-tone' | 'fa';
        /**
          * The class of the Font Awesome icon to draw
        */
        iconClass?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Icons buttons are simple, icon-only buttons that can be used for actions and in toolbars.
 * 
 *  @dependency cx-icon
 * 
 *  @event cx-blur - Emitted when the icon button loses focus.
 *  @event cx-focus - Emitted when the icon button gains focus.
 * 
 *  @slot badge - A badge to show on top right corner.
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxIconButtonAttributes extends HTMLAttributes<CxIconButton> {
              
        /**
          * The name of the icon to draw.
        */
        name?: string;
        /**
          * The variant of the icon to draw.
        */
        variant?: 'outlined' | 'filled' | 'round' | 'sharp' | 'two-tone' | 'fa';
        /**
          * The variant of the button.
        */
        buttonVariant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'default' | 'text' | 'tertiary' | 'custom';
        /**
          * An external URL of an SVG file. Be sure you trust the content you are including, as it will be executed as code and can
 *  result in XSS attacks.
        */
        src?: string;
        /**
          * When set, the underlying button will be rendered as an `a` with this `href` instead of a `button`.
        */
        href?: string;
        /**
          * Tells the browser where to open the link. Only used when `href` is set.
        */
        target?: '_blank' | '_parent' | '_self' | '_top';
        /**
          * Tells the browser to download the linked file as this filename. Only used when `href` is set.
        */
        download?: string;
        /**
          * A description that gets read by assistive devices. For optimal accessibility, you should always include a label that
 *  describes what the icon button does.
        */
        label?: string;
        /**
          * Disables the button.
        */
        disabled?: boolean;
        /**
          * The class of the Font Awesome icon to draw
        */
        iconClass?: string;
        /**
          * The button's size.
        */
        size?: 'small' | 'medium' | 'large' | 'x-large';
        /**
          * Draws an outlined button.
        */
        outline?: boolean;
        /**
          * Draws a circular icon button.
        */
        circle?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Alerts are used to display important messages inline or as toast notifications.
 *  @status stable
 *  @since 2.0
 * 
 *  @dependency cx-icon-button
 * 
 *  @slot - The alert's main content.
 *  @slot icon - An icon to show in the alert. Works best with `cx-icon`.
 * 
 *  @event cx-show - Emitted when the alert opens.
 *  @event cx-after-show - Emitted after the alert opens and all animations are complete.
 *  @event cx-hide - Emitted when the alert closes.
 *  @event cx-after-hide - Emitted after the alert closes and all animations are complete.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart icon - The container that wraps the optional icon.
 *  @csspart message - The container that wraps the alert's main content.
 *  @csspart close-button - The close button, an `cx-icon-button`.
 *  @csspart close-button__base - The close button's exported `base` part.
 * 
 *  @animation alert.show - The animation to use when showing the alert.
 *  @animation alert.hide - The animation to use when hiding the alert.
            */
            interface CxAlertAttributes extends HTMLAttributes<CxAlert> {
              
        /**
          * Indicates whether or not the alert is open. You can toggle this attribute to show and hide the alert, or you can
 *  use the `show()` and `hide()` methods and this attribute will reflect the alert's open state.
        */
        open?: boolean;
        /**
          * Enables a close button that allows the user to dismiss the alert.
        */
        closable?: boolean;
        /**
          * The alert's theme variant.
        */
        variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
        /**
          * The length of time, in milliseconds, the alert will show before closing itself. If the user interacts with
 *  the alert before it closes (e.g. moves the mouse over it), the timer will restart. Defaults to `Infinity`, meaning
 *  the alert will not close on its own.
        */
        duration?: number;
        /**
          * Enables a countdown that indicates the remaining time the alert will be displayed.
 *  Typically used to indicate the remaining time before a whole app refresh.
        */
        countdown?: 'rtl' | 'ltr';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary A component for displaying animated GIFs and WEBPs that play and pause on interaction.
 * 
 *  @dependency cx-icon
 * 
 *  @event cx-load - Emitted when the image loads successfully.
 *  @event cx-error - Emitted when the image fails to load.
 * 
 *  @slot play-icon - Optional play icon to use instead of the default. Works best with `cx-icon`.
 *  @slot pause-icon - Optional pause icon to use instead of the default. Works best with `cx-icon`.
 * 
 *  @part control-box - The container that surrounds the pause/play icons and provides their background.
 * 
 *  @cssproperty --control-box-size - The size of the icon box.
 *  @cssproperty --icon-size - The size of the play/pause icons.
            */
            interface CxAnimatedImageAttributes extends HTMLAttributes<CxAnimatedImage> {
              
        /**
          * The path to the image to load.
        */
        src?: string;
        /**
          * A description of the image used by assistive devices.
        */
        alt?: string;
        /**
          * Plays the animation. When this attribute is remove, the animation will pause.
        */
        play?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes. Powered by the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).
 * 
 *  @event cx-cancel - Emitted when the animation is canceled.
 *  @event cx-finish - Emitted when the animation finishes.
 *  @event cx-start - Emitted when the animation starts or restarts.
 * 
 *  @slot - The element to animate. Avoid slotting in more than one element, as subsequent ones will be ignored. To
 *   animate multiple elements, either wrap them in a single container or use multiple `cx-animation` elements.
            */
            interface CxAnimationAttributes extends HTMLAttributes<CxAnimation> {
              
        /**
          * The name of the built-in animation to use. For custom animations, use the `keyframes` prop.
        */
        name?: 'easings' | 'bounce' | 'flash' | 'headShake' | 'heartBeat' | 'jello' | 'pulse' | 'rubberBand' | 'shake' | 'shakeX' | 'shakeY' | 'swing' | 'tada' | 'wobble' | 'backInDown' | 'backInLeft' | 'backInRight' | 'backInUp' | 'backOutDown' | 'backOutLeft' | 'backOutRight' | 'backOutUp' | 'bounceIn' | 'bounceInDown' | 'bounceInLeft' | 'bounceInRight' | 'bounceInUp' | 'bounceOut' | 'bounceOutDown' | 'bounceOutLeft' | 'bounceOutRight' | 'bounceOutUp' | 'fadeIn' | 'fadeInBottomLeft' | 'fadeInBottomRight' | 'fadeInDown' | 'fadeInDownBig' | 'fadeInLeft' | 'fadeInLeftBig' | 'fadeInRight' | 'fadeInRightBig' | 'fadeInTopLeft' | 'fadeInTopRight' | 'fadeInUp' | 'fadeInUpBig' | 'fadeOut' | 'fadeOutBottomLeft' | 'fadeOutBottomRight' | 'fadeOutDown' | 'fadeOutDownBig' | 'fadeOutLeft' | 'fadeOutLeftBig' | 'fadeOutRight' | 'fadeOutRightBig' | 'fadeOutTopLeft' | 'fadeOutTopRight' | 'fadeOutUp' | 'fadeOutUpBig' | 'flip' | 'flipInX' | 'flipInY' | 'flipOutX' | 'flipOutY' | 'lightSpeedInLeft' | 'lightSpeedInRight' | 'lightSpeedOutLeft' | 'lightSpeedOutRight' | 'rotateIn' | 'rotateInDownLeft' | 'rotateInDownRight' | 'rotateInUpLeft' | 'rotateInUpRight' | 'rotateOut' | 'rotateOutDownLeft' | 'rotateOutDownRight' | 'rotateOutUpLeft' | 'rotateOutUpRight' | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideOutDown' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp' | 'hinge' | 'jackInTheBox' | 'rollIn' | 'rollOut' | 'zoomIn' | 'zoomInDown' | 'zoomInLeft' | 'zoomInRight' | 'zoomInUp' | 'zoomOut' | 'zoomOutDown' | 'zoomOutLeft' | 'zoomOutRight' | 'zoomOutUp' | 'none' | string;
        /**
          * Plays the animation. When omitted, the animation will be paused. This attribute will be automatically removed when
 *  the animation finishes or gets canceled.
        */
        play?: boolean;
        /**
          * The number of milliseconds to delay the start of the animation.
        */
        delay?: number;
        /**
          * Determines the direction of playback as well as the behavior when reaching the end of an iteration.
 *  [Learn more](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-direction)
        */
        direction?: 'alternate' | 'alternate-reverse' | 'normal' | 'reverse';
        /**
          * The number of milliseconds each iteration of the animation takes to complete.
        */
        duration?: number;
        /**
          * The easing function to use for the animation. This can be a Shoelace easing function or a custom easing function
 *  such as `cubic-bezier(0, 1, .76, 1.14)`.
        */
        easing?: 'ease' | 'linear' | 'easeIn' | 'easeInBack' | 'easeInCirc' | 'easeInCubic' | 'easeInExpo' | 'easeInOut' | 'easeInOutBack' | 'easeInOutCirc' | 'easeInOutCubic' | 'easeInOutExpo' | 'easeInOutQuad' | 'easeInOutQuart' | 'easeInOutQuint' | 'easeInOutSine' | 'easeInQuad' | 'easeInQuart' | 'easeInQuint' | 'easeInSine' | 'easeOut' | 'easeOutBack' | 'easeOutCirc' | 'easeOutCubic' | 'easeOutExpo' | 'easeOutQuad' | 'easeOutQuart' | 'easeOutQuint' | 'easeOutSine' | string;
        /**
          * The number of milliseconds to delay after the active period of an animation sequence.
        */
        endDelay?: number;
        /**
          * Sets how the animation applies styles to its target before and after its execution.
        */
        fill?: 'none' | 'auto' | 'backwards' | 'both' | 'forwards';
        /**
          * The number of iterations to run before the animation completes. Defaults to `Infinity`, which loops.
        */
        iterations?: number;
        /**
          * The offset at which to start the animation, usually between 0 (start) and 1 (end).
        */
        iterationStart?: number;
        /**
          * The keyframes to use for the animation. If this is set, `name` will be ignored.
        */
        keyframes?: { composite: 'auto' | 'accumulate' | 'add' | 'replace'; easing: string; offset: number; }[];
        /**
          * Sets the animation's playback rate. The default is `1`, which plays the animation at a normal speed. Setting this
 *  to `2`, for example, will double the animation's speed. A negative value can be used to reverse the animation. This
 *  value can be changed without causing the animation to restart.
        */
        playbackRate?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Avatars are used to represent a person or object.
 * 
 *  @dependency cx-icon
 * 
 *  @event cx-error - The image could not be loaded. This may because of an invalid URL, a temporary network condition, or some
 *  unknown cause.
 * 
 *  @slot icon - The default icon to use when no image or initials are present. Works best with `cx-icon`.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart icon - The container that wraps the avatar's icon.
 *  @csspart initials - The container that wraps the avatar's initials.
 *  @csspart image - The avatar image. Only shown when the `image` attribute is set.
 * 
 *  @cssproperty --size - The size of the avatar.
            */
            interface CxAvatarAttributes extends HTMLAttributes<CxAvatar> {
              
        /**
          * The image source to use for the avatar.
        */
        image?: string;
        /**
          * A label to use to describe the avatar to assistive devices.
        */
        label?: string;
        /**
          * Initials to use as a fallback when no image is available (1-2 characters max recommended).
        */
        initials?: string;
        /**
          * Indicates how the browser should load the image.
        */
        loading?: 'eager' | 'lazy';
        /**
          * The shape of the avatar.
        */
        shape?: 'circle' | 'rounded' | 'square';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Badges are used to draw attention and display statuses or counts.
 * 
 *  @slot - The badge's content.
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxBadgeAttributes extends HTMLAttributes<CxBadge> {
              
        /**
          * The badge's theme variant.
        */
        variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
        /**
          * Draws a pill-style badge with rounded edges.
        */
        pill?: boolean;
        /**
          * Makes the badge pulsate to draw attention.
        */
        pulse?: boolean;
        /**
          * The badge's size.
        */
        size?: 'small' | 'medium' | 'large' | 'x-small';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Breadcrumb Items are used inside [breadcrumbs](?s=atoms&id=/breadcrumb) to represent different links.
 * 
 *  @slot - The breadcrumb item's label.
 *  @slot prefix - An optional prefix, usually an icon or icon button.
 *  @slot suffix - An optional suffix, usually an icon or icon button.
 *  @slot separator - The separator to use for the breadcrumb item. This will only change the separator for this item. If
 *  you want to change it for all items in the group, set the separator on `cx-breadcrumb` instead.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart label - The breadcrumb item's label.
 *  @csspart prefix - The container that wraps the prefix.
 *  @csspart suffix - The container that wraps the suffix.
 *  @csspart separator - The container that wraps the separator.
            */
            interface CxBreadcrumbItemAttributes extends HTMLAttributes<CxBreadcrumbItem> {
              
        /**
          * Optional URL to direct the user to when the breadcrumb item is activated. When set, a link will be rendered
 *  internally. When unset, a button will be rendered instead.
        */
        href?: string;
        /**
          * Tells the browser where to open the link. Only used when `href` is set.
        */
        target?: '_blank' | '_parent' | '_self' | '_top';
        /**
          * The `rel` attribute to use on the link. Only used when `href` is set.
        */
        rel?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Breadcrumbs provide a group of links so users can easily navigate a website's hierarchy.
 * 
 *  @slot - One or more breadcrumb items to display.
 *  @slot separator - The separator to use between breadcrumb items. Works best with `cx-icon`.
 * 
 *  @dependency cx-icon
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxBreadcrumbAttributes extends HTMLAttributes<CxBreadcrumb> {
              
        /**
          * The label to use for the breadcrumb control. This will not be shown on the screen, but it will be announced by
 *  screen readers and other assistive devices to provide more context for users.
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Popup is a utility that lets you declaratively anchor "popup" containers to another element.
 * 
 *  @event cx-reposition - Emitted when the popup is repositioned. This event can fire a lot, so avoid putting expensive
 *   operations in your listener or consider debouncing it.
 * 
 *  @slot - The popup's content.
 *  @slot anchor - The element the popup will be anchored to. If the anchor lives outside of the popup, you can use the
 *   `anchor` attribute or property instead.
 * 
 *  @csspart arrow - The arrow's container. Avoid setting `top|bottom|left|right` properties, as these values are
 *   assigned dynamically as the popup moves. This is most useful for applying a background color to match the popup, and
 *   maybe a border or box shadow.
 *  @csspart popup - The popup's container. Useful for setting a background color, box shadow, etc.
 *  @csspart hover-bridge - The hover bridge element. Only available when the `hover-bridge` option is enabled.
 * 
 *  @cssproperty [--arrow-size=6px] - The size of the arrow. Note that an arrow won't be shown unless the `arrow`
 *   attribute is used.
 *  @cssproperty [--arrow-color=var(--cx-color-neutral-0)] - The color of the arrow.
 *  @cssproperty [--auto-size-available-width] - A read-only custom property that determines the amount of width the
 *   popup can be before overflowing. Useful for positioning child elements that need to overflow. This property is only
 *   available when using `auto-size`.
 *  @cssproperty [--auto-size-available-height] - A read-only custom property that determines the amount of height the
 *   popup can be before overflowing. Useful for positioning child elements that need to overflow. This property is only
 *   available when using `auto-size`.
            */
            interface CxPopupAttributes extends HTMLAttributes<CxPopup> {
              
        /**
          * The element the popup will be anchored to. If the anchor lives outside of the popup, you can provide the anchor
 *  element `id`, a DOM element reference, or a `VirtualElement`. If the anchor lives inside the popup, use the
 *  `anchor` slot instead.
        */
        anchor?: string;
        /**
          * Activates the positioning logic and shows the popup. When this attribute is removed, the positioning logic is torn
 *  down and the popup will be hidden.
        */
        active?: boolean;
        /**
          * The preferred placement of the popup. Note that the actual placement will vary as configured to keep the
 *  panel inside of the viewport.
        */
        placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end' | 'center';
        /**
          * Determines how the popup is positioned. The `absolute` strategy works well in most cases, but if overflow is
 *  clipped, using a `fixed` position strategy can often workaround it.
        */
        strategy?: 'absolute' | 'fixed' | 'overlay';
        /**
          * The distance in pixels from which to offset the panel away from its anchor.
        */
        distance?: number;
        /**
          * The distance in pixels from which to offset the panel along its anchor.
        */
        skidding?: number;
        /**
          * Attaches an arrow to the popup. The arrow's size and color can be customized using the `--arrow-size` and
 *  `--arrow-color` custom properties. For additional customizations, you can also target the arrow using
 *  `::part(arrow)` in your stylesheet.
        */
        arrow?: boolean;
        /**
          * The placement of the arrow. The default is `anchor`, which will align the arrow as close to the center of the
 *  anchor as possible, considering available space and `arrow-padding`. A value of `start`, `end`, or `center` will
 *  align the arrow to the start, end, or center of the popover instead.
        */
        arrowPlacement?: 'center' | 'start' | 'end' | 'anchor';
        /**
          * The amount of padding between the arrow and the edges of the popup. If the popup has a border-radius, for example,
 *  this will prevent it from overflowing the corners.
        */
        arrowPadding?: number;
        /**
          * When set, placement of the popup will flip to the opposite site to keep it in view. You can use
 *  `flipFallbackPlacements` to further configure how the fallback placement is determined.
        */
        flip?: boolean;
        /**
          * If the preferred placement doesn't fit, popup will be tested in these fallback placements until one fits. Must be a
 *  string of any number of placements separated by a space, e.g. "top bottom left". If no placement fits, the flip
 *  fallback strategy will be used instead.
        */
        flipFallbackPlacements?: string;
        /**
          * When neither the preferred placement nor the fallback placements fit, this value will be used to determine whether
 *  the popup should be positioned using the best available fit based on available space or as it was initially
 *  preferred.
        */
        flipFallbackStrategy?: 'best-fit' | 'initial';
        /**
          * The amount of padding, in pixels, to exceed before the flip behavior will occur.
        */
        flipPadding?: number;
        /**
          * Moves the popup along the axis to keep it in view when clipped.
        */
        shift?: boolean;
        /**
          * The amount of padding, in pixels, to exceed before the shift behavior will occur.
        */
        shiftPadding?: number;
        /**
          * When set, this will cause the popup to automatically resize itself to prevent it from overflowing.
        */
        autoSize?: 'both' | 'horizontal' | 'vertical';
        /**
          * Syncs the popup's width or height to that of the anchor element.
        */
        sync?: 'both' | 'width' | 'height';
        /**
          * The amount of padding, in pixels, to exceed before the auto-size behavior will occur.
        */
        autoSizePadding?: number;
        /**
          * When a gap exists between the anchor and the popup element, this option will add a "hover bridge" that fills the
 *  gap using an invisible element. This makes listening for events such as `mouseenter` and `mouseleave` more sane
 *  because the pointer never technically leaves the element. The hover bridge will only be drawn when the popover is
 *  active.
        */
        hoverBridge?: boolean;
        /**
          * The factor by which to multiply the available width when using `auto-size`. E.g: Set to 0.5 to
 *  make the popup half the width of the available space.
        */
        autoWidthFactor?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Spinners are used to show the progress of an indeterminate operation.
 * 
 *  @csspart base - The component's base wrapper.
 * 
 *  @cssproperty --track-width - The width of the track.
 *  @cssproperty --track-color - The color of the track.
 *  @cssproperty --indicator-color - The color of the spinner's indicator.
 *  @cssproperty --speed - The time it takes for the spinner to complete one animation cycle.
            */
            interface CxSpinnerAttributes extends HTMLAttributes<CxSpinner> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Menu items provide options for the user to pick from in a menu.
 * 
 *  @dependency cx-icon
 *  @dependency cx-popup
 *  @dependency cx-spinner
 * 
 *  @slot - The menu item's label.
 *  @slot prefix - Used to prepend an icon or similar element to the menu item.
 *  @slot suffix - Used to append an icon or similar element to the menu item.
 *  @slot submenu - Used to denote a nested menu.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart checked-icon - The checked icon, which is only visible when the menu item is checked.
 *  @csspart prefix - The prefix container.
 *  @csspart label - The menu item label.
 *  @csspart suffix - The suffix container.
 *  @csspart spinner - The spinner that shows when the menu item is in the loading state.
 *  @csspart spinner__base - The spinner's base part.
 *  @csspart submenu-icon - The submenu icon, visible only when the menu item has a submenu (not yet implemented).
 * 
 *  @cssproperty [--submenu-offset=-2px] - The distance submenus shift to overlap the parent menu.
            */
            interface CxMenuItemAttributes extends HTMLAttributes<CxMenuItem> {
              
        /**
          * The type of menu item to render. To use `checked`, this value must be set to `checkbox`.
        */
        type?: 'normal' | 'checkbox';
        /**
          * Draws the item in a checked state.
        */
        checked?: boolean;
        /**
          * A unique value to store in the menu item. This can be used as a way to identify menu items when selected.
        */
        value?: string;
        /**
          * When set, the underlying menu item will be rendered as an `a` with this `href`.
        */
        href?: string;
        /**
          * Tells the browser where to open the link. Only used when `href` is set.
        */
        target?: '_blank' | '_parent' | '_self' | '_top';
        /**
          * When using `href`, this attribute will map to the underlying link's `rel` attribute. Unlike regular links, the
 *  default is `noreferrer noopener` to prevent security exploits. However, if you're using `target` to point to a
 *  specific tab/window, this will prevent that from working correctly. You can remove or change the default value by
 *  setting the attribute to an empty string or a value of your choice, respectively.
        */
        rel?: string;
        /**
          * Tells the browser to download the linked file as this filename. Only used when `href` is set.
        */
        download?: string;
        /**
          * Draws the menu item in a loading state.
        */
        loading?: boolean;
        /**
          * Draws the menu item in a disabled state, preventing selection.
        */
        disabled?: boolean;
        /**
          * Makes the menu item readonly
        */
        readonly?: boolean;
        /**
          * 
        */
        menu?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Inputs collect data from the user.
 * 
 *  @dependency cx-icon
 * 
 *  @slot label - The input's label. Alternatively, you can use the `label` attribute.
 *  @slot prefix - Used to prepend a presentational icon or similar element to the input.
 *  @slot suffix - Used to append a presentational icon or similar element to the input.
 *  @slot clear-icon - An icon to use in lieu of the default clear icon.
 *  @slot show-password-icon - An icon to use in lieu of the default show password icon.
 *  @slot hide-password-icon - An icon to use in lieu of the default hide password icon.
 *  @slot help-text - Text that describes how to use the input. Alternatively, you can use the `help-text` attribute.
 *  @slot file-button - The button that opens the file picker. Alternatively, you can use the `file-button-label` attribute.
 * 
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-change - Emitted when an alteration to the control's value is committed by the user.
 *  @event cx-clear - Emitted when the clear button is activated.
 *  @event cx-focus - Emitted when the control gains focus.
 *  @event cx-input - Emitted when the control receives input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 *  @event cx-keydown - Emitted when a key is pressed down on the control.
 * 
 *  @csspart form-control - The form control that wraps the label, input, and help text.
 *  @csspart form-control-label - The label's wrapper.
 *  @csspart form-control-input - The input's wrapper.
 *  @csspart form-control-help-text - The help text's wrapper.
 *  @csspart base - The component's base wrapper.
 *  @csspart input - The internal `input` control.
 *  @csspart prefix - The container that wraps the prefix.
 *  @csspart clear-button - The clear button.
 *  @csspart password-toggle-button - The password toggle button.
 *  @csspart suffix - The container that wraps the suffix.
            */
            interface CxInputAttributes extends HTMLAttributes<CxInput> {
              
        /**
          * 
        */
        title?: string;
        /**
          * The type of input. Works the same as a native `input` element, but only a subset of types are supported. Defaults
 *  to `text`.
        */
        type?: 'number' | 'text' | 'date' | 'datetime-local' | 'email' | 'password' | 'search' | 'tel' | 'time' | 'file' | 'url';
        /**
          * The name of the input, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the input, submitted as a name/value pair with form data.
        */
        value?: string;
        /**
          * If used with mask, this stores the input's value, with fixed strings omitted.
        */
        unmaskedValue?: string;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultValue?: string;
        /**
          * The input's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Draws a filled input.
        */
        filled?: boolean;
        /**
          * Draws a pill-style input with rounded edges.
        */
        pill?: boolean;
        /**
          * The input's label. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * The input's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * Adds a clear button when the input is not empty.
        */
        clearable?: boolean;
        /**
          * Disables the input.
        */
        disabled?: boolean;
        /**
          * Placeholder text to show as a hint when the input is empty.
        */
        placeholder?: string;
        /**
          * Makes the input readonly.
        */
        readonly?: boolean;
        /**
          * Adds a button to toggle the password's visibility. Only applies to password types.
        */
        passwordToggle?: boolean;
        /**
          * Determines whether or not the password is currently visible. Only applies to password input types.
        */
        passwordVisible?: boolean;
        /**
          * Hides the browser's built-in increment/decrement spin buttons for number inputs.
        */
        noSpinButtons?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Makes the input a required field.
        */
        required?: boolean;
        /**
          * A regular expression pattern to validate input against.
        */
        pattern?: string;
        /**
          * The minimum length of input that will be considered valid.
        */
        minlength?: number;
        /**
          * The maximum length of input that will be considered valid.
        */
        maxlength?: number;
        /**
          * The input's minimum value. Only applies to date and number input types.
        */
        min?: string;
        /**
          * The input's maximum value. Only applies to date and number input types.
        */
        max?: string;
        /**
          * Specifies the granularity that the value must adhere to, or the special value `any` which means no stepping is
 *  implied, allowing any numeric value. Only applies to date and number input types.
        */
        step?: string;
        /**
          * Controls whether and how text input is automatically capitalized as it is entered by the user.
        */
        autocapitalize?: 'none' | 'off' | 'on' | 'sentences' | 'words' | 'characters';
        /**
          * Indicates whether the browser's autocorrect feature is on or off.
        */
        autocorrect?: 'off' | 'on';
        /**
          * Specifies what permission the browser has to provide assistance in filling out form field values. Refer to
 *  [this page on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) for available values.
        */
        autocomplete?: string;
        /**
          * Indicates that the input should receive focus on page load.
        */
        autofocus?: boolean;
        /**
          * Used to customize the label or icon of the Enter key on virtual keyboards.
        */
        enterkeyhint?: 'search' | 'enter' | 'done' | 'go' | 'next' | 'previous' | 'send';
        /**
          * Enables spell checking on the input.
        */
        spellcheck?: boolean;
        /**
          * Tells the browser what type of data will be entered by the user, allowing it to display the appropriate virtual
 *  keyboard on supportive devices.
        */
        inputmode?: 'text' | 'none' | 'email' | 'search' | 'tel' | 'url' | 'decimal' | 'numeric';
        /**
          * #region Input Mask properties The mask pattern to apply to the input.
        */
        mask?: string;
        /**
          * The character to use as a placeholder when the input is empty. Defaults to '_'.
        */
        maskPlaceholder?: string;
        /**
          * Whether or not to lazy mask the input. When `true`, the mask will only be applied after the user starts typing.
        */
        maskLazy?: boolean;
        /**
          * Enables characters overwriting instead of inserting.
        */
        maskOverwrite?: string;
        /**
          * The `accept` attribute of the file input. This attribute contains a comma-separated list of unique file type
 *  For example, `accept="image/png, image/jpeg"`.
        */
        accept?: string;
        /**
          * The `multiple` attribute of the file input. This attribute indicates that the user can enter more than one value.
        */
        multiple?: boolean;
        /**
          * The Choose file's theme variant.
        */
        variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'default' | 'text' | 'tertiary' | 'custom';
        /**
          * 
        */
        fileButtonLabel?: string;
        /**
          * 
        */
        buttonOnly?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Menus provide a list of options for the user to choose from.
 * 
 *  @slot - The menu's content, including menu items, menu labels, and dividers.
 *  @slot back-button - A slot for a custom back button, used in 'multiple' variant menus.
 * 
 *  @event {{ item: CxMenuItem }} cx-select - Emitted when a menu item is selected.
            */
            interface CxMenuAttributes extends HTMLAttributes<CxMenu> {
              
        /**
          * 
        */
        horizontal?: boolean;
        /**
          * The menu's variant
        */
        variant?: 'default' | 'multiple';
        /**
          * Whether the menu is currently active, used for 'multiple' variant
        */
        active?: boolean;
        /**
          * The name of the menu, used for 'multiple' variant
        */
        name?: string;
        /**
          * The name of the menu to go back to, used for 'multiple' variant
        */
        back?: string;
        /**
          * Whether the menu is the default menu, used for 'multiple' variant
        */
        default?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Textareas collect data from the user and allow multiple lines of text.
 * 
 *  @slot label - The textarea's label. Alternatively, you can use the `label` attribute.
 *  @slot help-text - Text that describes how to use the input. Alternatively, you can use the `help-text` attribute.
 * 
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-change - Emitted when an alteration to the control's value is committed by the user.
 *  @event cx-focus - Emitted when the control gains focus.
 *  @event cx-input - Emitted when the control receives input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @csspart form-control - The form control that wraps the label, input, and help text.
 *  @csspart form-control-label - The label's wrapper.
 *  @csspart form-control-input - The input's wrapper.
 *  @csspart form-control-help-text - The help text's wrapper.
 *  @csspart base - The component's base wrapper.
 *  @csspart textarea - The internal `textarea` control.
            */
            interface CxTextareaAttributes extends HTMLAttributes<CxTextarea> {
              
        /**
          * 
        */
        title?: string;
        /**
          * make reactive to pass through The name of the textarea, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the textarea, submitted as a name/value pair with form data.
        */
        value?: string;
        /**
          * The textarea's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Draws a filled textarea.
        */
        filled?: boolean;
        /**
          * The textarea's label. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * The textarea's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * Placeholder text to show as a hint when the input is empty.
        */
        placeholder?: string;
        /**
          * The number of rows to display by default.
        */
        rows?: number;
        /**
          * Controls how the textarea can be resized.
        */
        resize?: 'none' | 'auto' | 'vertical';
        /**
          * Disables the textarea.
        */
        disabled?: boolean;
        /**
          * Makes the textarea readonly.
        */
        readonly?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Makes the textarea a required field.
        */
        required?: boolean;
        /**
          * The minimum length of input that will be considered valid.
        */
        minlength?: number;
        /**
          * The maximum length of input that will be considered valid.
        */
        maxlength?: number;
        /**
          * Controls whether and how text input is automatically capitalized as it is entered by the user.
        */
        autocapitalize?: 'none' | 'off' | 'on' | 'sentences' | 'words' | 'characters';
        /**
          * Indicates whether the browser's autocorrect feature is on or off.
        */
        autocorrect?: string;
        /**
          * Specifies what permission the browser has to provide assistance in filling out form field values. Refer to
 *  [this page on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) for available values.
        */
        autocomplete?: string;
        /**
          * Indicates that the input should receive focus on page load.
        */
        autofocus?: boolean;
        /**
          * Used to customize the label or icon of the Enter key on virtual keyboards.
        */
        enterkeyhint?: 'search' | 'enter' | 'done' | 'go' | 'next' | 'previous' | 'send';
        /**
          * Enables spell checking on the textarea.
        */
        spellcheck?: boolean;
        /**
          * Tells the browser what type of data will be entered by the user, allowing it to display the appropriate virtual
 *  keyboard on supportive devices.
        */
        inputmode?: 'text' | 'none' | 'email' | 'search' | 'tel' | 'url' | 'decimal' | 'numeric';
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultValue?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Dropdowns expose additional content that "drops down" in a panel.
 * 
 *  @dependency cx-popup
 * 
 *  @slot - The dropdown's main content.
 *  @slot trigger - The dropdown's trigger, usually a `cx-button` element.
 * 
 *  @event cx-show - Emitted when the dropdown opens.
 *  @event cx-after-show - Emitted after the dropdown opens and all animations are complete.
 *  @event cx-hide - Emitted when the dropdown closes.
 *  @event cx-after-hide - Emitted after the dropdown closes and all animations are complete.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart trigger - The container that wraps the trigger.
 *  @csspart panel - The panel that gets shown when the dropdown is open.
 * 
 *  @animation dropdown.show - The animation to use when showing the dropdown.
 *  @animation dropdown.hide - The animation to use when hiding the dropdown.
            */
            interface CxDropdownAttributes extends HTMLAttributes<CxDropdown> {
              
        /**
          * Indicates whether or not the dropdown is open. You can toggle this attribute to show and hide the dropdown, or you
 *  can use the `show()` and `hide()` methods and this attribute will reflect the dropdown's open state.
        */
        open?: boolean;
        /**
          * The preferred placement of the dropdown panel. Note that the actual placement may vary as needed to keep the panel
 *  inside of the viewport.
        */
        placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
        /**
          * Disables the dropdown so the panel will not open.
        */
        disabled?: boolean;
        /**
          * By default, the dropdown is closed when an item is selected. This attribute will keep it open instead. Useful for
 *  dropdowns that allow for multiple interactions.
        */
        stayOpenOnSelect?: boolean;
        /**
          * The distance in pixels from which to offset the panel away from its trigger.
        */
        distance?: number;
        /**
          * The distance in pixels from which to offset the panel along its trigger.
        */
        skidding?: number;
        /**
          * Enable this option to prevent the panel from being clipped when the component is placed inside a container with
 *  `overflow: auto|scroll`. Hoisting uses a fixed positioning strategy that works in many, but not all, scenarios.
        */
        hoist?: boolean;
        /**
          * Syncs the popup width or height to that of the trigger element.
        */
        sync?: 'both' | 'width' | 'height';
        /**
          * The factor by which to multiply the available width when using `auto-size`. E.g: Set to 0.5 to
 *  make the popup half the width of the available space.
        */
        autoWidthFactor?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Buttons represent actions that are available to the user.
 * 
 *  @dependency cx-icon
 *  @dependency cx-spinner
 * 
 *  @event cx-blur - Emitted when the button loses focus.
 *  @event cx-focus - Emitted when the button gains focus.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @slot - The button's label.
 *  @slot prefix - A presentational prefix icon or similar element.
 *  @slot suffix - A presentational suffix icon or similar element.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart prefix - The container that wraps the prefix.
 *  @csspart label - The button's label.
 *  @csspart suffix - The container that wraps the suffix.
 *  @csspart caret - The button's caret icon, an `cx-icon` element.
 *  @csspart spinner - The spinner that shows when the button is in the loading state.
            */
            interface CxButtonAttributes extends HTMLAttributes<CxButton> {
              
        /**
          * 
        */
        title?: string;
        /**
          * make reactive to pass through The button's theme variant.
        */
        variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'default' | 'text' | 'tertiary' | 'custom';
        /**
          * The button's size.
        */
        size?: 'small' | 'medium' | 'large' | 'x-large';
        /**
          * Draws the button with a caret. Used to indicate that the button triggers a dropdown menu or similar behavior.
        */
        caret?: boolean;
        /**
          * Disables the button.
        */
        disabled?: boolean;
        /**
          * Draws the button in a loading state.
        */
        loading?: boolean;
        /**
          * Draws an outlined button.
        */
        outline?: boolean;
        /**
          * Draws a pill-style button with rounded edges.
        */
        pill?: boolean;
        /**
          * Draws a circular icon button. When this attribute is present, the button expects a single `cx-icon` in the
 *  default slot.
        */
        circle?: boolean;
        /**
          * The type of button. Note that the default value is `button` instead of `submit`, which is opposite of how native
 *  `button` elements behave. When the type is `submit`, the button will submit the surrounding form.
        */
        type?: 'button' | 'reset' | 'submit';
        /**
          * The name of the button, submitted as a name/value pair with form data, but only when this button is the submitter.
 *  This attribute is ignored when `href` is present.
        */
        name?: string;
        /**
          * The value of the button, submitted as a pair with the button's name as part of the form data, but only when this
 *  button is the submitter. This attribute is ignored when `href` is present.
        */
        value?: string;
        /**
          * When set, the underlying button will be rendered as an `a` with this `href` instead of a `button`.
        */
        href?: string;
        /**
          * Tells the browser where to open the link. Only used when `href` is present.
        */
        target?: '_blank' | '_parent' | '_self' | '_top';
        /**
          * When using `href`, this attribute will map to the underlying link's `rel` attribute. Unlike regular links, the
 *  default is `noreferrer noopener` to prevent security exploits. However, if you're using `target` to point to a
 *  specific tab/window, this will prevent that from working correctly. You can remove or change the default value by
 *  setting the attribute to an empty string or a value of your choice, respectively.
        */
        rel?: string;
        /**
          * Tells the browser to download the linked file as this filename. Only used when `href` is present.
        */
        download?: string;
        /**
          * The "form owner" to associate the button with. If omitted, the closest containing form will be used instead. The
 *  value of this attribute must be an id of a form in the same document or shadow root as the button.
        */
        form?: string;
        /**
          * Used to override the form owner's `action` attribute.
        */
        formaction?: string;
        /**
          * Used to override the form owner's `enctype` attribute.
        */
        formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
        /**
          * Used to override the form owner's `method` attribute.
        */
        formmethod?: 'post' | 'get';
        /**
          * Used to override the form owner's `novalidate` attribute.
        */
        formnovalidate?: boolean;
        /**
          * Used to override the form owner's `target` attribute.
        */
        formtarget?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Button groups can be used to group related buttons into sections.
 * 
 *  @slot - One or more `cx-button` elements to display in the button group.
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxButtonGroupAttributes extends HTMLAttributes<CxButtonGroup> {
              
        /**
          * A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive
 *  devices when interacting with the control and is strongly recommended.
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Cards can be used to group related subjects in a container.
 * 
 *  @slot - The card's main content.
 *  @slot header - An optional header for the card.
 *  @slot footer - An optional footer for the card.
 *  @slot image - An optional image to render at the start of the card.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart image - The container that wraps the card's image.
 *  @csspart header - The container that wraps the card's header.
 *  @csspart body - The container that wraps the card's main content.
 *  @csspart footer - The container that wraps the card's footer.
 * 
 *  @cssproperty --border-color - The card's border color, including borders that occur inside the card.
 *  @cssproperty --border-radius - The border radius for the card's edges.
 *  @cssproperty --border-width - The width of the card's borders.
 *  @cssproperty --padding - The padding to use for the card's sections.
            */
            interface CxCardAttributes extends HTMLAttributes<CxCard> {
              
        /**
          * Draws the option in an interactive state.
        */
        interactive?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary A carousel item represent a slide within a [carousel](?s=atoms&id=/carousel).
 * 
 *  @since 2.0
 *  @status experimental
 * 
 *  @slot - The carousel item's content..
 * 
 *  @cssproperty --aspect-ratio - The slide's aspect ratio. Inherited from the carousel by default.
            */
            interface CxCarouselItemAttributes extends HTMLAttributes<CxCarouselItem> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Carousels display an arbitrary number of content slides along a horizontal or vertical axis.
 * 
 *  @since 2.2
 *  @status experimental
 * 
 *  @dependency cx-icon
 * 
 *  @event {{ index: number, slide: CxCarouselItem }} cx-slide-change - Emitted when the active slide changes.
 * 
 *  @slot - The carousel's main content, one or more `cx-carousel-item` elements.
 *  @slot next-icon - Optional next icon to use instead of the default. Works best with `cx-icon`.
 *  @slot previous-icon - Optional previous icon to use instead of the default. Works best with `cx-icon`.
 * 
 *  @csspart base - The carousel's internal wrapper.
 *  @csspart scroll-container - The scroll container that wraps the slides.
 *  @csspart pagination - The pagination indicators wrapper.
 *  @csspart pagination-item - The pagination indicator.
 *  @csspart pagination-item--active - Applied when the item is active.
 *  @csspart navigation - The navigation wrapper.
 *  @csspart navigation-button - The navigation button.
 *  @csspart navigation-button--previous - Applied to the previous button.
 *  @csspart navigation-button--next - Applied to the next button.
 * 
 *  @cssproperty --slide-gap - The space between each slide.
 *  @cssproperty [--aspect-ratio=16/9] - The aspect ratio of each slide.
 *  @cssproperty --scroll-hint - The amount of padding to apply to the scroll area, allowing adjacent slides to become
 *   partially visible as a scroll hint.
            */
            interface CxCarouselAttributes extends HTMLAttributes<CxCarousel> {
              
        /**
          * When set, allows the user to navigate the carousel in the same direction indefinitely.
        */
        loop?: boolean;
        /**
          * When set, show the carousel's navigation.
        */
        navigation?: boolean;
        /**
          * When set, show the carousel's pagination indicators.
        */
        pagination?: boolean;
        /**
          * When set, the slides will scroll automatically when the user is not interacting with them.
        */
        autoplay?: boolean;
        /**
          * Specifies the amount of time, in milliseconds, between each automatic scroll.
        */
        autoplayInterval?: number;
        /**
          * Specifies how many slides should be shown at a given time.
        */
        slidesPerPage?: number;
        /**
          * Specifies the number of slides the carousel will advance when scrolling, useful when specifying a `slides-per-page`
 *  greater than one. It can't be higher than `slides-per-page`.
        */
        slidesPerMove?: number;
        /**
          * Specifies the orientation in which the carousel will lay out.
        */
        orientation?: 'horizontal' | 'vertical';
        /**
          * When set, it is possible to scroll through the slides by dragging them with the mouse.
        */
        mouseDragging?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Checkboxes allow the user to toggle an option on or off.
 * 
 *  @dependency cx-icon
 * 
 *  @slot - The checkbox's label.
 *  @slot help-text - Text that describes how to use the checkbox. Alternatively, you can use the `help-text` attribute.
 * 
 *  @event cx-blur - Emitted when the checkbox loses focus.
 *  @event cx-change - Emitted when the checked state changes.
 *  @event cx-focus - Emitted when the checkbox gains focus.
 *  @event cx-input - Emitted when the checkbox receives input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart control - The square container that wraps the checkbox's checked state.
 *  @csspart control--checked - Matches the control part when the checkbox is checked.
 *  @csspart control--indeterminate - Matches the control part when the checkbox is indeterminate.
 *  @csspart checked-icon - The checked icon, an `cx-icon` element.
 *  @csspart indeterminate-icon - The indeterminate icon, an `cx-icon` element.
 *  @csspart label - The container that wraps the checkbox's label.
 *  @csspart form-control-help-text - The help text's wrapper.
            */
            interface CxCheckboxAttributes extends HTMLAttributes<CxCheckbox> {
              
        /**
          * 
        */
        title?: string;
        /**
          * make reactive to pass through The name of the checkbox, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the checkbox, submitted as a name/value pair with form data.
        */
        value?: string;
        /**
          * The checkbox's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Disables the checkbox.
        */
        disabled?: boolean;
        /**
          * Draws the checkbox in a checked state.
        */
        checked?: boolean;
        /**
          * Draws the checkbox in an indeterminate state. This is usually applied to checkboxes that represents a "select
 *  all/none" behavior when associated checkboxes have a mix of checked and unchecked states.
        */
        indeterminate?: boolean;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultChecked?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Makes the checkbox a required field.
        */
        required?: boolean;
        /**
          * The checkbox's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Dividers are used to visually separate or group elements.
 * 
 *  @cssproperty --color - The color of the divider.
 *  @cssproperty --width - The width of the divider.
 *  @cssproperty --spacing - The spacing of the divider.
            */
            interface CxDividerAttributes extends HTMLAttributes<CxDivider> {
              
        /**
          * Draws the divider in a vertical orientation.
        */
        vertical?: boolean;
        /**
          * 
        */
        variant?: 'custom' | 'solid';
        /**
          * 
        */
        usePadding?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Renders markdown passed in as a string. cx-markdown is a Light DOM element, so can be styled
 *  from outside the Shadow DOM.
 * 
 *  @event cx-ready - Emitted when the markdown has been rendered.
            */
            interface CxMarkdownAttributes extends HTMLAttributes<CxMarkdown> {
              
        /**
          * The class name to apply to the root element. As this is a light DOM element, it can be styled
 *  from outside the Shadow DOM.
        */
        classname?: string;
        /**
          * 
        */
        liveScript?: boolean;
        /**
          * The markdown to render.
        */
        markdown?: string;
        /**
          * A marked renderer object to use when rendering the markdown. This overrides the current renderer
 *  only for those methods that are specifically defined on the passed in renderer object.
        */
        renderer?: CxMarkdownRendererObject;
        /**
          * Extensions to add to the marked parser.
        */
        extensions?: { name: string; level: 'block' | 'inline'; childTokens: string[]; } | { name: string; } | { name: string; level: 'block' | 'inline'; childTokens: string[]; }[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Tooltips display additional information based on a specific action.
 * 
 *  @dependency cx-popup
 * 
 *  @slot - The tooltip's target element. Avoid slotting in more than one element, as subsequent ones will be ignored.
 *  @slot content - The content to render in the tooltip. Alternatively, you can use the `content` attribute.
 * 
 *  @event cx-show - Emitted when the tooltip begins to show.
 *  @event cx-after-show - Emitted after the tooltip has shown and all animations are complete.
 *  @event cx-hide - Emitted when the tooltip begins to hide.
 *  @event cx-after-hide - Emitted after the tooltip has hidden and all animations are complete.
 * 
 *  @csspart base - The component's base wrapper, an `cx-popup` element.
 *  @csspart base__popup - The popup's exported `popup` part. Use this to target the tooltip's popup container.
 *  @csspart base__arrow - The popup's exported `arrow` part. Use this to target the tooltip's arrow.
 *  @csspart body - The tooltip's body where its content is rendered.
 *  @csspart hover-bridge - The hover bridge element. Only available when the `hover-bridge` option is enabled.
 *  @cssproperty --max-width - The maximum width of the tooltip before its content will wrap.
 *  @cssproperty --hide-delay - The amount of time to wait before hiding the tooltip when hovering.
 *  @cssproperty --show-delay - The amount of time to wait before showing the tooltip when hovering.
 * 
 *  @animation tooltip.show - The animation to use when showing the tooltip.
 *  @animation tooltip.hide - The animation to use when hiding the tooltip.
            */
            interface CxTooltipAttributes extends HTMLAttributes<CxTooltip> {
              
        /**
          * The tooltip's content. If you need to display HTML, use the `content` slot instead.
        */
        content?: string;
        /**
          * The preferred placement of the tooltip. Note that the actual placement may vary as needed to keep the tooltip
 *  inside of the viewport.
        */
        placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
        /**
          * Disables the tooltip so it won't show when triggered.
        */
        disabled?: boolean;
        /**
          * The distance in pixels from which to offset the tooltip away from its target.
        */
        distance?: number;
        /**
          * Indicates whether or not the tooltip is open. You can use this in lieu of the show/hide methods.
        */
        open?: boolean;
        /**
          * The distance in pixels from which to offset the tooltip along its target.
        */
        skidding?: number;
        /**
          * Controls how the tooltip is activated. Possible options include `click`, `hover`, `focus`, and `manual`. Multiple
 *  options can be passed by separating them with a space. When manual is used, the tooltip must be activated
 *  programmatically.
        */
        trigger?: string;
        /**
          * Enable this option to prevent the tooltip from being clipped when the component is placed inside a container with
 *  `overflow: auto|hidden|scroll`. Hoisting uses a fixed positioning strategy that works in many, but not all,
 *  scenarios.
        */
        hoist?: boolean;
        /**
          * When a gap exists between the anchor and the popup element, this option will add a "hover bridge" that fills the
 *  gap using an invisible element. This makes listening for events such as `mouseenter` and `mouseleave` more sane
 *  because the pointer never technically leaves the element. The hover bridge will only be drawn when the popover is
 *  active.
        */
        hoverBridge?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxTypographyAttributes extends HTMLAttributes<CxTypography> {
              
        /**
          * 
        */
        variant?: 'body1' | 'body2' | 'body3' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'small';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary A chatbot component to interact with Cortex AI Assistant.
 * 
 *  @dependency cx-tooltip
 *  @dependency cx-icon-button
 *  @dependency cx-markdown
 *  @dependency cx-icon
 *  @dependency cx-typography
 *  @dependency cx-checkbox
 *  @dependency cx-menu
 *  @dependency cx-menu-item
 *  @dependency cx-input
 *  @dependency cx-badge
 *  @dependency cx-dropdown
 *  @dependency cx-button
 *  @dependency cx-divider
            */
            interface CxChatbotAttributes extends HTMLAttributes<CxChatbot> {
              
        /**
          * The conversation ID to connect to the chatbot
        */
        conversationId?: string;
        /**
          * The title of the chatbot
        */
        conversationTitle?: string;
        /**
          * The purpose of the conversation
        */
        conversationPurpose?: string;
        /**
          * The name of the chatbot
        */
        botName?: string;
        /**
          * The name of the user
        */
        userName?: string;
        /**
          * The events to show in the chatbot's menu
        */
        events?: CxChatbotChatbotEvent[];
        /**
          * The connection URL to the chatbot
        */
        connectionURL?: string;
        /**
          * The number of cited references to show in the reference footer before collapsing. If -1, show all cited references
        */
        referenceNumberLimit?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The visually hidden utility makes content accessible to assistive devices without displaying it on the screen.
 * 
 *  @slot - The content to be visually hidden.
            */
            interface CxVisuallyHiddenAttributes extends HTMLAttributes<CxVisuallyHidden> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Color pickers allow the user to select a color.
 * 
 *  @dependency cx-button
 *  @dependency cx-button-group
 *  @dependency cx-dropdown
 *  @dependency cx-input
 *  @dependency cx-visually-hidden
 * 
 *  @slot label - The color picker's form label. Alternatively, you can use the `label` attribute.
 * 
 *  @event cx-blur - Emitted when the color picker loses focus.
 *  @event cx-change - Emitted when the color picker's value changes.
 *  @event cx-focus - Emitted when the color picker receives focus.
 *  @event cx-input - Emitted when the color picker receives input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 *  @event cx-swatch-add - Emitted when a color is added to the custom swatches.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart trigger - The color picker's dropdown trigger.
 *  @csspart swatches - The container that holds the swatches.
 *  @csspart swatch - Each individual swatch.
 *  @csspart grid - The color grid.
 *  @csspart grid-handle - The color grid's handle.
 *  @csspart slider - Hue and opacity sliders.
 *  @csspart slider-handle - Hue and opacity slider handles.
 *  @csspart hue-slider - The hue slider.
 *  @csspart hue-slider-handle - The hue slider's handle.
 *  @csspart opacity-slider - The opacity slider.
 *  @csspart opacity-slider-handle - The opacity slider's handle.
 *  @csspart preview - The preview color.
 *  @csspart input - The text input.
 *  @csspart eye-dropper-button - The eye dropper button.
 *  @csspart eye-dropper-button__base - The eye dropper button's exported `button` part.
 *  @csspart eye-dropper-button__prefix - The eye dropper button's exported `prefix` part.
 *  @csspart eye-dropper-button__label - The eye dropper button's exported `label` part.
 *  @csspart eye-dropper-button__suffix - The eye dropper button's exported `suffix` part.
 *  @csspart eye-dropper-button__caret - The eye dropper button's exported `caret` part.
 *  @csspart format-button - The format button.
 *  @csspart format-button__base - The format button's exported `button` part.
 *  @csspart format-button__prefix - The format button's exported `prefix` part.
 *  @csspart format-button__label - The format button's exported `label` part.
 *  @csspart format-button__suffix - The format button's exported `suffix` part.
 *  @csspart format-button__caret - The format button's exported `caret` part.
 * 
 *  @cssproperty --grid-width - The width of the color grid.
 *  @cssproperty --grid-height - The height of the color grid.
 *  @cssproperty --grid-handle-size - The size of the color grid's handle.
 *  @cssproperty --slider-height - The height of the hue and alpha sliders.
 *  @cssproperty --slider-handle-size - The diameter of the slider's handle.
 *  @cssproperty --swatch-size - The size of each predefined color swatch.
            */
            interface CxColorPickerAttributes extends HTMLAttributes<CxColorPicker> {
              
        /**
          * The current value of the color picker. The value's format will vary based the `format` attribute. To get the value
 *  in a specific format, use the `getFormattedValue()` method. The value is submitted as a name/value pair with form
 *  data.
        */
        value?: string;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultValue?: string;
        /**
          * The color picker's label. This will not be displayed, but it will be announced by assistive devices. If you need to
 *  display HTML, you can use the `label` slot` instead.
        */
        label?: string;
        /**
          * The variant of the form control.
        */
        variant?: 'default' | 'button';
        /**
          * The format to use. If opacity is enabled, these will translate to HEXA, RGBA, HSLA, and HSVA respectively. The color
 *  picker will accept user input in any format (including CSS color names) and convert it to the desired format.
        */
        format?: 'hex' | 'rgb' | 'hsl' | 'hsv';
        /**
          * Renders the color picker inline rather than in a dropdown.
        */
        inline?: boolean;
        /**
          * Determines the size of the color picker's trigger. This has no effect on inline color pickers.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Removes the button that lets users toggle between format.
        */
        noFormatToggle?: boolean;
        /**
          * The name of the form control, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * Disables the color picker.
        */
        disabled?: boolean;
        /**
          * Enable this option to prevent the panel from being clipped when the component is placed inside a container with
 *  `overflow: auto|scroll`. Hoisting uses a fixed positioning strategy that works in many, but not all, scenarios.
        */
        hoist?: boolean;
        /**
          * Shows the opacity slider. Enabling this will cause the formatted value to be HEXA, RGBA, or HSLA.
        */
        opacity?: boolean;
        /**
          * By default, values are lowercase. With this attribute, values will be uppercase instead.
        */
        uppercase?: boolean;
        /**
          * Adds a clear button when the input is not empty.
        */
        clearable?: boolean;
        /**
          * 
        */
        tooltip?: string;
        /**
          * One or more predefined color swatches to display as presets in the color picker. Can include any format the color
 *  picker can parse, including HEX(A), RGB(A), HSL(A), HSV(A), and CSS color names. Each color must be separated by a
 *  semicolon (`;`). Alternatively, you can pass an array of color values to this property using JavaScript.
        */
        swatches?: string;
        /**
          * Similar to swatches, but for user-defined custom colors.
        */
        customSwatches?: string;
        /**
          * Set to true to display a loading spinner.
        */
        loading?: boolean;
        /**
          * Set to true to display a button that allows user to add current color to custom swatches.
        */
        creatable?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Makes the color picker a required field.
        */
        required?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Copies text data to the clipboard when the user clicks the trigger.
 * 
 *  @dependency cx-icon
 *  @dependency cx-tooltip
 * 
 *  @event cx-copy - Emitted when the data has been copied.
 *  @event cx-error - Emitted when the data could not be copied.
 * 
 *  @slot copy-icon - The icon to show in the default copy state. Works best with `cx-icon`.
 *  @slot success-icon - The icon to show when the content is copied. Works best with `cx-icon`.
 *  @slot error-icon - The icon to show when a copy error occurs. Works best with `cx-icon`.
 * 
 *  @csspart button - The internal `button` element.
 *  @csspart copy-icon - The container that holds the copy icon.
 *  @csspart success-icon - The container that holds the success icon.
 *  @csspart error-icon - The container that holds the error icon.
 *  @csspart tooltip__base - The tooltip's exported `base` part.
 *  @csspart tooltip__base__popup - The tooltip's exported `popup` part.
 *  @csspart tooltip__base__arrow - The tooltip's exported `arrow` part.
 *  @csspart tooltip__body - The tooltip's exported `body` part.
 * 
 *  @cssproperty --success-color - The color to use for success feedback.
 *  @cssproperty --error-color - The color to use for error feedback.
 * 
 *  @animation copy.in - The animation to use when feedback icons animate in.
 *  @animation copy.out - The animation to use when feedback icons animate out.
            */
            interface CxCopyButtonAttributes extends HTMLAttributes<CxCopyButton> {
              
        /**
          * The text value to copy.
        */
        value?: string;
        /**
          * The button's size.
        */
        size?: 'small' | 'medium' | 'large' | 'x-large';
        /**
          * An id that references an element in the same document from which data will be copied. If both this and `value` are
 *  present, this value will take precedence. By default, the target element's `textContent` will be copied. To copy an
 *  attribute, append the attribute name wrapped in square brackets, e.g. `from="el[value]"`. To copy a property,
 *  append a dot and the property name, e.g. `from="el.value"`.
        */
        from?: string;
        /**
          * Disables the copy button.
        */
        disabled?: boolean;
        /**
          * A custom label to show in the tooltip.
        */
        copyLabel?: string;
        /**
          * A custom label to show in the tooltip after copying.
        */
        successLabel?: string;
        /**
          * A custom label to show in the tooltip when a copy error occurs.
        */
        errorLabel?: string;
        /**
          * The length of time to show feedback before restoring the default trigger.
        */
        feedbackDuration?: number;
        /**
          * The preferred placement of the tooltip.
        */
        tooltipPlacement?: 'top' | 'bottom' | 'right' | 'left';
        /**
          * Enable this option to prevent the tooltip from being clipped when the component is placed inside a container with
 *  `overflow: auto|hidden|scroll`. Hoisting uses a fixed positioning strategy that works in many, but not all,
 *  scenarios.
        */
        hoist?: boolean;
        /**
          * Hide icon optionally
        */
        noIcon?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Details show a brief summary and expand to show additional content.
 * 
 *  @dependency cx-icon
 * 
 *  @slot - The details' main content.
 *  @slot summary - The details' summary. Alternatively, you can use the `summary` attribute.
 *  @slot expand-icon - Optional expand icon to use instead of the default. Works best with `cx-icon`.
 *  @slot collapse-icon - Optional collapse icon to use instead of the default. Works best with `cx-icon`.
 * 
 *  @event cx-show - Emitted when the details opens.
 *  @event cx-after-show - Emitted after the details opens and all animations are complete.
 *  @event cx-hide - Emitted when the details closes.
 *  @event cx-after-hide - Emitted after the details closes and all animations are complete.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart header - The header that wraps both the summary and the expand/collapse icon.
 *  @csspart summary - The container that wraps the summary.
 *  @csspart summary-icon - The container that wraps the expand/collapse icons.
 *  @csspart content - The details content.
 * 
 *  @animation details.show - The animation to use when showing details. You can use `height: auto` with this animation.
 *  @animation details.hide - The animation to use when hiding details. You can use `height: auto` with this animation.
            */
            interface CxDetailsAttributes extends HTMLAttributes<CxDetails> {
              
        /**
          * Indicates whether or not the details is open. You can toggle this attribute to show and hide the details, or you
 *  can use the `show()` and `hide()` methods and this attribute will reflect the details' open state.
        */
        open?: boolean;
        /**
          * The summary to show in the header. If you need to display HTML, use the `summary` slot instead.
        */
        summary?: string;
        /**
          * Disables the details so it can't be toggled.
        */
        disabled?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Dialogs, sometimes called "modals", appear above the page and require the user's immediate attention.
 * 
 *  @dependency cx-icon-button
 *  @dependency cx-divider
 *  @dependency cx-popup
 * 
 *  @slot - The dialog's main content.
 *  @slot label - The dialog's label. Alternatively, you can use the `label` attribute.
 *  @slot header-actions - Optional actions to add to the header. Works best with `cx-icon-button`.
 *  @slot footer - The dialog's footer, usually one or more buttons representing various options.
 *  @slot overlay - The dialog's overlay, usually used when another dialog uses this dialog as the boundary.
 *   Then, that dialog's overlay can be put inside the overlay slot to inherit the width and height of the current dialog's panel.
 * 
 *  @event cx-show - Emitted when the dialog opens.
 *  @event cx-after-show - Emitted after the dialog opens and all animations are complete.
 *  @event cx-hide - Emitted when the dialog closes.
 *  @event cx-after-hide - Emitted after the dialog closes and all animations are complete.
 *  @event cx-initial-focus - Emitted when the dialog opens and is ready to receive focus. Calling
 *    `event.preventDefault()` will prevent focusing and allow you to set it on a different element, such as an input.
 *  @event {{ source: 'close-button' | 'keyboard' | 'overlay' }} cx-request-close - Emitted when the user attempts to
 *    close the dialog by clicking the close button, clicking the overlay, or pressing escape. Calling
 *    `event.preventDefault()` will keep the dialog open. Avoid using this unless closing the dialog will result in
 *    destructive behavior such as data loss.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart overlay - The overlay that covers the screen behind the dialog.
 *  @csspart panel - The dialog's panel (where the dialog and its content are rendered).
 *  @csspart header - The dialog's header. This element wraps the title and header actions.
 *  @csspart header-actions - Optional actions to add to the header. Works best with `cx-icon-button`.
 *  @csspart title - The dialog's title.
 *  @csspart close-button - The close button, an `cx-icon-button`.
 *  @csspart close-button__base - The close button's exported `base` part.
 *  @csspart body - The dialog's body.
 *  @csspart footer - The dialog's footer.
 * 
 *  @cssproperty --width - The preferred width of the dialog. Note that the dialog will shrink to accommodate smaller screens.
 *  @cssproperty --header-spacing - The amount of padding to use for the header.
 *  @cssproperty --body-spacing - The amount of padding to use for the body.
 *  @cssproperty --footer-spacing - The amount of padding to use for the footer.
 * 
 *  @animation dialog.show - The animation to use when showing the dialog.
 *  @animation dialog.hide - The animation to use when hiding the dialog.
 *  @animation dialog.denyClose - The animation to use when a request to close the dialog is denied.
 *  @animation dialog.overlay.show - The animation to use when showing the dialog's overlay.
 *  @animation dialog.overlay.hide - The animation to use when hiding the dialog's overlay.
 * 
 *  @property open - Indicates whether or not the dialog is open. You can toggle this attribute to show and hide the dialog, or you can
 *    use the `show()` and `hide()` methods and this attribute will reflect the dialog's open state.
 *  @property label - The dialog's label as displayed in the header. You should always include a relevant label even when using
 *    `no-header`, as it is required for proper accessibility. If you need to display HTML, use the `label` slot instead.
 *  @property noHeader - Disables the header. This will also remove the default close button, so please ensure you provide an easy,
 *    accessible way for users to dismiss the dialog.
 *  @property boundary - The element to which the dialog will be centered inside.
 *  @property disableOverlayClick - Prevents the dialog from closing when clicking the overlay.
 *  @property modal - Exposes the internal modal utility that controls focus trapping. To temporarily disable focus
 *    trapping and allow third-party modals spawned from an active Shoelace modal, call `modal.activateExternal()` when
 *    the third-party modal opens. Upon closing, call `modal.deactivateExternal()` to restore Shoelace's focus trapping.
            */
            interface CxDialogAttributes extends HTMLAttributes<CxDialog> {
              
        /**
          * Indicates whether or not the dialog is open. You can toggle this attribute to show and hide the dialog, or you can
 *  use the `show()` and `hide()` methods and this attribute will reflect the dialog's open state.
        */
        open?: boolean;
        /**
          * The dialog's label as displayed in the header. You should always include a relevant label even when using
 *  `no-header`, as it is required for proper accessibility. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * Disables the header. This will also remove the default close button, so please ensure you provide an easy,
 *  accessible way for users to dismiss the dialog.
        */
        noHeader?: boolean;
        /**
          * Enables the overlay scrollbar plugin, which provides a custom scrollbar that does not take up any content space.
 *  This is useful for dialogs that contain scrollable content.
        */
        useOverlayScrollbar?: boolean;
        /**
          * Preventing the dialog from closing when clicking the overlay.
        */
        disableOverlayClick?: boolean;
        /**
          * The `strategy` property of the `cx-popup` component.
        */
        strategy?: 'fixed' | 'overlay';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Drawers slide in from a container to expose additional options and information.
 * 
 *  @dependency cx-icon-button
 * 
 *  @slot - The drawer's main content.
 *  @slot label - The drawer's label. Alternatively, you can use the `label` attribute.
 *  @slot header-actions - Optional actions to add to the header. Works best with `cx-icon-button`.
 *  @slot footer - The drawer's footer, usually one or more buttons representing various options.
 * 
 *  @event cx-show - Emitted when the drawer opens.
 *  @event cx-after-show - Emitted after the drawer opens and all animations are complete.
 *  @event cx-hide - Emitted when the drawer closes.
 *  @event cx-after-hide - Emitted after the drawer closes and all animations are complete.
 *  @event cx-initial-focus - Emitted when the drawer opens and is ready to receive focus. Calling
 *    `event.preventDefault()` will prevent focusing and allow you to set it on a different element, such as an input.
 *  @event {{ source: 'close-button' | 'keyboard' | 'overlay' }} cx-request-close - Emitted when the user attempts to
 *    close the drawer by clicking the close button, clicking the overlay, or pressing escape. Calling
 *    `event.preventDefault()` will keep the drawer open. Avoid using this unless closing the drawer will result in
 *    destructive behavior such as data loss.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart overlay - The overlay that covers the screen behind the drawer.
 *  @csspart panel - The drawer's panel (where the drawer and its content are rendered).
 *  @csspart header - The drawer's header. This element wraps the title and header actions.
 *  @csspart header-actions - Optional actions to add to the header. Works best with `cx-icon-button`.
 *  @csspart title - The drawer's title.
 *  @csspart close-button - The close button, an `cx-icon-button`.
 *  @csspart close-button__base - The close button's exported `base` part.
 *  @csspart body - The drawer's body.
 *  @csspart footer - The drawer's footer.
 * 
 *  @cssproperty --size - The preferred size of the drawer. This will be applied to the drawer's width or height
 *    depending on its `placement`. Note that the drawer will shrink to accommodate smaller screens.
 *  @cssproperty --header-spacing - The amount of padding to use for the header.
 *  @cssproperty --body-spacing - The amount of padding to use for the body.
 *  @cssproperty --footer-spacing - The amount of padding to use for the footer.
 * 
 *  @animation drawer.showTop - The animation to use when showing a drawer with `top` placement.
 *  @animation drawer.showEnd - The animation to use when showing a drawer with `end` placement.
 *  @animation drawer.showBottom - The animation to use when showing a drawer with `bottom` placement.
 *  @animation drawer.showStart - The animation to use when showing a drawer with `start` placement.
 *  @animation drawer.hideTop - The animation to use when hiding a drawer with `top` placement.
 *  @animation drawer.hideEnd - The animation to use when hiding a drawer with `end` placement.
 *  @animation drawer.hideBottom - The animation to use when hiding a drawer with `bottom` placement.
 *  @animation drawer.hideStart - The animation to use when hiding a drawer with `start` placement.
 *  @animation drawer.denyClose - The animation to use when a request to close the drawer is denied.
 *  @animation drawer.overlay.show - The animation to use when showing the drawer's overlay.
 *  @animation drawer.overlay.hide - The animation to use when hiding the drawer's overlay.
 * 
 *  @property modal - Exposes the internal modal utility that controls focus trapping. To temporarily disable focus
 *    trapping and allow third-party modals spawned from an active Shoelace modal, call `modal.activateExternal()` when
 *    the third-party modal opens. Upon closing, call `modal.deactivateExternal()` to restore Shoelace's focus trapping.
            */
            interface CxDrawerAttributes extends HTMLAttributes<CxDrawer> {
              
        /**
          * Indicates whether or not the drawer is open. You can toggle this attribute to show and hide the drawer, or you can
 *  use the `show()` and `hide()` methods and this attribute will reflect the drawer's open state.
        */
        open?: boolean;
        /**
          * The drawer's label as displayed in the header. You should always include a relevant label even when using
 *  `no-header`, as it is required for proper accessibility. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * The direction from which the drawer will open.
        */
        placement?: 'top' | 'bottom' | 'start' | 'end';
        /**
          * By default, the drawer slides out of its containing block (usually the viewport). To make the drawer slide out of
 *  its parent element, set this attribute and add `position: relative` to the parent.
        */
        contained?: boolean;
        /**
          * Removes the header. This will also remove the default close button, so please ensure you provide an easy,
 *  accessible way for users to dismiss the drawer.
        */
        noHeader?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary A component that allows you to clamp the number of elements shown in a container, with a button to toggle
 * 
 *  @dependency cx-button
            */
            interface CxElementClampAttributes extends HTMLAttributes<CxElementClamp> {
              
        /**
          * Indicates whether or not the details is open. You can toggle this attribute to show and hide the details, or you
 *  can use the `show()` and `hide()` methods and this attribute will reflect the details' open state.
        */
        open?: boolean;
        /**
          * Disables the details so it can't be toggled.
        */
        disabled?: boolean;
        /**
          * The number of elements to show before clamping.
        */
        elements?: number;
        /**
          * The root element to use for the intersection observer.
        */
        rootElement?: string;
        /**
          * Whether to animate the opening and closing of the details.
        */
        animation?: boolean;
        /**
          * Whether to show the show more button.
        */
        showMore?: boolean;
        /**
          * The text to show on the show more button.
        */
        showMoreText?: string;
        /**
          * The text to show on the show less button.
        */
        showLessText?: string;
        /**
          * The event to listen to for rerendering the component
        */
        rerenderEvent?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The Resize Observer component offers a thin, declarative interface to the [`ResizeObserver API`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).
 * 
 *  @slot - One or more elements to watch for resizing.
 * 
 *  @event {{ entries: ResizeObserverEntry[] }} cx-resize - Emitted when the element is resized.
            */
            interface CxResizeObserverAttributes extends HTMLAttributes<CxResizeObserver> {
              
        /**
          * Disables the observer.
        */
        disabled?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary A web component for clamping text to a specific number of lines, allowing for single or multiline ellipsis.
 * 
 *  @csspart content - The component's content wrapper.
            */
            interface CxLineClampAttributes extends HTMLAttributes<CxLineClamp> {
              
        /**
          * The number of lines to clamp the text to.
        */
        lines?: number;
        /**
          * Whether the content is open or not.
        */
        open?: boolean;
        /**
          * Whether to show the show more button.
        */
        showMore?: boolean;
        /**
          * The text to show on the show more button.
        */
        showMoreText?: string;
        /**
          * The text to show on the show less button.
        */
        showLessText?: string;
        /**
          * The tooltip to show. When this prop is set, the component will always show a tooltip.
        */
        tooltip?: string;
        /**
          * 
        */
        disabledTooltip?: boolean;
        /**
          * 
        */
        hoverBridge?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The cx-tree-item component is used to serve as a hierarchical node that lives inside a [tree](?s=atoms&id=/tree).
 * 
 *  @dependency cx-checkbox
 *  @dependency cx-icon
 *  @dependency cx-spinner
 * 
 *  @event cx-expand - Emitted when the tree item expands.
 *  @event cx-after-expand - Emitted after the tree item expands and all animations are complete.
 *  @event cx-collapse - Emitted when the tree item collapses.
 *  @event cx-after-collapse - Emitted after the tree item collapses and all animations are complete.
 *  @event cx-lazy-change - Emitted when the tree item's lazy state changes.
 *  @event cx-lazy-load - Emitted when a lazy item is selected. Use this event to asynchronously load data and append
 *   items to the tree before expanding. After appending new items, remove the `lazy` attribute to remove the loading
 *   state and update the tree.
 * 
 *  @slot - The default slot.
 *  @slot expand-icon - The icon to show when the tree item is expanded.
 *  @slot collapse-icon - The icon to show when the tree item is collapsed.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart item - The tree item's container. This element wraps everything except slotted tree item children.
 *  @csspart item--disabled - Applied when the tree item is disabled.
 *  @csspart item--expanded - Applied when the tree item is expanded.
 *  @csspart item--indeterminate - Applied when the selection is indeterminate.
 *  @csspart item--selected - Applied when the tree item is selected.
 *  @csspart indentation - The tree item's indentation container.
 *  @csspart expand-button - The container that wraps the tree item's expand button and spinner.
 *  @csspart label - The tree item's label.
 *  @csspart children - The container that wraps the tree item's nested children.
 *  @csspart checkbox - The checkbox that shows when using multiselect.
 *  @csspart checkbox__base - The checkbox's exported `base` part.
 *  @csspart checkbox__control - The checkbox's exported `control` part.
 *  @csspart checkbox__control--checked - The checkbox's exported `control--checked` part.
 *  @csspart checkbox__control--indeterminate - The checkbox's exported `control--indeterminate` part.
 *  @csspart checkbox__checked-icon - The checkbox's exported `checked-icon` part.
 *  @csspart checkbox__indeterminate-icon - The checkbox's exported `indeterminate-icon` part.
 *  @csspart checkbox__label - The checkbox's exported `label` part.
            */
            interface CxTreeItemAttributes extends HTMLAttributes<CxTreeItem> {
              
        /**
          * Expands the tree item.
        */
        expanded?: boolean;
        /**
          * Draws the tree item in a selected state.
        */
        selected?: boolean;
        /**
          * Disables the tree item.
        */
        disabled?: boolean;
        /**
          * Makes the tree item readonly.
        */
        readonly?: boolean;
        /**
          * Enables lazy loading behavior.
        */
        lazy?: boolean;
        /**
          * Handled by Cortex: Tree item's ID.
        */
        itemid?: string;
        /**
          * Whether to allow the tree to be sorted by dragging and dropping items.
        */
        sortable?: boolean;
        /**
          * The group name for the sortable items.
 *  This allows multiple sortable lists to be grouped together, so items can be dragged between them.
        */
        sortableGroup?: string;
        /**
          * Expand button placement
        */
        expandButtonPlacement?: 'start' | 'end';
        /**
          * Indicates whether the tree checkboxes should be synced with the selected state of the tree items.
 *  For example, when select all children, the parent checkbox will be checked. When parent checkbox is checked, all children will be checked.
 *  If set to `true`, the children and parent checked state will be independent of each other.
 *  This is only applicable when `selection` is set to `multiple`.
        */
        disabledSyncCheckboxes?: boolean;
        /**
          * Indicates whether the tree checkboxes should show always indeterminate state when any of the children are checked.
 *  If set to 'true', the parent checkbox will be indeterminate when some or all of its children are checked.
 *  This is only applicable when the selection is set to 'multiple'.
 *  This is used to mimic the behavior of a partial selection in Orange Logic platform.
        */
        partialSyncCheckboxes?: boolean;
        /**
          * Indicates whether the tree item was previously selected.
 *  Use only when the selection is set to 'multiple' and the partialSyncCheckboxes is set to 'true'.
 *  This is used to determine whether the tree item should still be indeterminate when all children are unchecked.
        */
        previouslySelected?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The cx-tree component is used to display a hierarchical list of selectable [tree items](?s=atoms&id=/tree-item). Items with children can be expanded and collapsed as desired by the user.
 * 
 *  @event {{ selection: CxTreeItem[] }} cx-selection-change - Emitted when a tree item is selected or deselected.
 * 
 *  @slot - The default slot.
 *  @slot expand-icon - The icon to show when the tree item is expanded. Works best with `cx-icon`.
 *  @slot collapse-icon - The icon to show when the tree item is collapsed. Works best with `cx-icon`.
 * 
 *  @csspart base - The component's base wrapper.
 * 
 *  @cssproperty [--indent-size=var(--cx-spacing-medium)] - The size of the indentation for nested items.
 *  @cssproperty [--indent-guide-color=var(--cx-color-neutral-200)] - The color of the indentation line.
 *  @cssproperty [--indent-guide-offset=0] - The amount of vertical spacing to leave between the top and bottom of the
 *   indentation line's starting position.
 *  @cssproperty [--indent-guide-style=solid] - The style of the indentation line, e.g. solid, dotted, dashed.
 *  @cssproperty [--indent-guide-width=0] - The width of the indentation line.
            */
            interface CxTreeAttributes extends HTMLAttributes<CxTree> {
              
        /**
          * Whether to allow the tree to be sorted by dragging and dropping items.
        */
        sortable?: boolean;
        /**
          * Defines the group name for this tree, allowing multiple trees to be sortable together.
        */
        sortableGroup?: string;
        /**
          * Whether to disable the sortable group feature, allowing items to be sorted only within the tree.
        */
        disabledSortableGroup?: boolean;
        /**
          * The selection behavior of the tree. Single selection allows only one node to be selected at a time. Multiple
 *  displays checkboxes and allows more than one node to be selected. Leaf allows only leaf nodes to be selected.
        */
        selection?: 'multiple' | 'single' | 'leaf';
        /**
          * Whether to automatically expand after loading finishes.
        */
        disabledAutoExpand?: boolean;
        /**
          * Whether to automatically expand to the selected items.
        */
        autoExpandToSelected?: boolean;
        /**
          * Expand button placement
        */
        expandButtonPlacement?: 'start' | 'end';
        /**
          * When set to true, the `cx-selection-change` event will be emitted on every change of the value, even if the value is not changed.
        */
        forceOnChange?: boolean;
        /**
          * When set to true, clicking the label of a tree item will deselect all other items and select the clicked item.
 *  This is useful when the selection mode is set to 'multiple' and you want to allow the user to select a single item
 *  by clicking its label, without having to use the checkbox. This is the behavior of the filter in DAM view.
        */
        labelSelectSingle?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Formats a number as a human readable bytes value.
            */
            interface CxFormatBytesAttributes extends HTMLAttributes<CxFormatBytes> {
              
        /**
          * The number to format in bytes.
        */
        value?: number;
        /**
          * The type of unit to display.
        */
        unit?: 'byte' | 'bit';
        /**
          * Determines how to display the result, e.g. "100 bytes", "100 b", or "100b".
        */
        display?: 'long' | 'short' | 'narrow';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Options define the selectable items within various form controls such as [select](?s=atoms&id=/select).
 * 
 *  @dependency cx-icon
 * 
 *  @slot - The option's label.
 *  @slot prefix - Used to prepend an icon or similar element to the menu item.
 *  @slot suffix - Used to append an icon or similar element to the menu item.
 * 
 *  @csspart checked-icon - The checked icon, an `cx-icon` element.
 *  @csspart base - The component's base wrapper.
 *  @csspart label - The option's label.
 *  @csspart prefix - The container that wraps the prefix.
 *  @csspart suffix - The container that wraps the suffix.
            */
            interface CxOptionAttributes extends HTMLAttributes<CxOption> {
              
        /**
          * we need this because Safari doesn't honor :hover styles while dragging The option's value. When selected, the containing form control will receive this value. The value must be unique
 *  from other options in the same group. Values may not contain spaces, as spaces are used as delimiters when listing
 *  multiple values.
        */
        value?: string;
        /**
          * Draws the option in a disabled state, preventing selection.
        */
        disabled?: boolean;
        /**
          * Whether to show check icon prefix for selected option.
        */
        showCheck?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Progress bars are used to show the status of an ongoing operation.
 * 
 *  @slot - A label to show inside the progress indicator.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart indicator - The progress bar's indicator.
 *  @csspart label - The progress bar's label.
 * 
 *  @cssproperty --height - The progress bar's height.
 *  @cssproperty --track-color - The color of the track.
 *  @cssproperty --indicator-color - The color of the indicator.
 *  @cssproperty --label-color - The color of the label.
            */
            interface CxProgressBarAttributes extends HTMLAttributes<CxProgressBar> {
              
        /**
          * The current progress as a percentage, 0 to 100.
        */
        value?: number;
        /**
          * When true, percentage is ignored, the label is hidden, and the progress bar is drawn in an indeterminate state.
        */
        indeterminate?: boolean;
        /**
          * The title of the progress bar.
        */
        label?: string;
        /**
          * When true, the percentage is drawn.
        */
        showProgress?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Outputs a localized time phrase relative to the current date and time.
            */
            interface CxRelativeTimeAttributes extends HTMLAttributes<CxRelativeTime> {
              
        /**
          * The date from which to calculate time from. If not set, the current date and time will be used. When passing a
 *  string, it's strongly recommended to use the ISO 8601 format to ensure timezones are handled correctly. To convert
 *  a date to this format in JavaScript, use [`date.toISOString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString).
        */
        date?: string;
        /**
          * The formatting style to use.
        */
        format?: 'long' | 'short' | 'narrow';
        /**
          * When `auto`, values such as "yesterday" and "tomorrow" will be shown when possible. When `always`, values such as
 *  "1 day ago" and "in 1 day" will be shown.
        */
        numeric?: 'auto' | 'always';
        /**
          * Keep the displayed value up to date as time passes.
        */
        sync?: boolean;
        /**
          * The interval in milliseconds to update the displayed value when `sync` is enabled. If not set, the component will
 *  determine the next update interval based on the current time unit (e.g., second, minute, hour, day).
        */
        syncInterval?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Tags are used as labels to organize things or to indicate a selection.
 * 
 *  @dependency cx-icon-button
 * 
 *  @slot - The tag's content.
 * 
 *  @event cx-remove - Emitted when the remove button is activated.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart content - The tag's content.
 *  @csspart remove-button - The tag's remove button, an `cx-icon-button`.
 *  @csspart remove-button__base - The remove button's exported `base` part.
            */
            interface CxTagAttributes extends HTMLAttributes<CxTag> {
              
        /**
          * The tag's theme variant.
        */
        variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'text';
        /**
          * The tag's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Draws a pill-style tag with rounded edges.
        */
        pill?: boolean;
        /**
          * Makes the tag removable and shows a remove button.
        */
        removable?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Selects allow you to choose items from a menu of predefined options.
 * 
 *  @dependency cx-icon
 *  @dependency cx-popup
 *  @dependency cx-tag
 * 
 *  @slot - The listbox options. Can be any HTML element, nested or not, as long as they have role="option".
 *          However, default logic supports only `cx-option` elements. Make sure to override the default logic. See region Overridable.
 *          You can use `cx-divider` to group items visually.
 *  @slot label - The input's label. Alternatively, you can use the `label` attribute.
 *  @slot prefix - Used to prepend a presentational icon or similar element to the combobox.
 *  @slot suffix - Used to append a presentational icon or similar element to the combobox.
 *  @slot clear-icon - An icon to use in lieu of the default clear icon.
 *  @slot expand-icon - The icon to show when the control is expanded and collapsed. Rotates on open and close.
 *  @slot help-text - Text that describes how to use the input. Alternatively, you can use the `help-text` attribute.
 * 
 *  @event cx-change - Emitted when the control's value changes.
 *  @event cx-clear - Emitted when the control's value is cleared.
 *  @event cx-input - Emitted when the control receives input.
 *  @event cx-focus - Emitted when the control gains focus.
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-show - Emitted when the select's menu opens.
 *  @event cx-after-show - Emitted after the select's menu opens and all animations are complete.
 *  @event cx-hide - Emitted when the select's menu closes.
 *  @event cx-after-hide - Emitted after the select's menu closes and all animations are complete.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @csspart form-control - The form control that wraps the label, input, and help text.
 *  @csspart form-control-label - The label's wrapper.
 *  @csspart form-control-input - The select's wrapper.
 *  @csspart form-control-help-text - The help text's wrapper.
 *  @csspart combobox - The container the wraps the prefix, suffix, combobox, clear icon, and expand button.
 *  @csspart prefix - The container that wraps the prefix slot.
 *  @csspart suffix - The container that wraps the suffix slot.
 *  @csspart display-input - The element that displays the selected option's label, an `input` element.
 *  @csspart listbox - The listbox container where options are slotted.
 *  @csspart tags - The container that houses option tags when `multiselect` is used.
 *  @csspart tag - The individual tags that represent each multiselect option.
 *  @csspart tag__base - The tag's base part.
 *  @csspart tag__content - The tag's content part.
 *  @csspart tag__remove-button - The tag's remove button.
 *  @csspart tag__remove-button__base - The tag's remove button base part.
 *  @csspart clear-button - The clear button.
 *  @csspart expand-icon - The container that wraps the expand icon.
            */
            interface CxSelectAttributes extends HTMLAttributes<CxSelect> {
              
        /**
          * The name of the select, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the select, submitted as a name/value pair with form data. When `multiple` is enabled, the
 *  value attribute will be a space-delimited list of values based on the options selected, and the value property will
 *  be an array. **For this reason, values must not contain spaces.
        */
        value?: string;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultValue?: string;
        /**
          * The select's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Placeholder text to show as a hint when the select is empty.
        */
        placeholder?: string;
        /**
          * If this property is enabled the user will be able to enter a free text value without being forced to select an option from the suggested values.
 *  Otherwise, when no value is selected, the input will be cleared.
        */
        allowFreetext?: boolean;
        /**
          * Allows more than one option to be selected.
        */
        multiple?: boolean;
        /**
          * The maximum number of selected options to show when `multiple` is true. After the maximum, "+n" will be shown to
 *  indicate the number of additional items that are selected. Set to 0 to remove the limit.
        */
        maxOptionsVisible?: number;
        /**
          * Disables the select control.
        */
        disabled?: boolean;
        /**
          * Adds a clear button when the select is not empty.
        */
        clearable?: boolean;
        /**
          * Indicates whether or not the select is open. You can toggle this attribute to show and hide the menu, or you can
 *  use the `show()` and `hide()` methods and this attribute will reflect the select's open state.
        */
        open?: boolean;
        /**
          * Enable this option to prevent the listbox from being clipped when the component is placed inside a container with
 *  `overflow: auto|scroll`. Hoisting uses a fixed positioning strategy that works in many, but not all, scenarios.
        */
        hoist?: boolean;
        /**
          * By default, the select menu's width matches the select's width. Set this to true to make the menu as wide as the content.
        */
        freeWidth?: boolean;
        /**
          * The autosize padding of the listbox dropdown.
        */
        autoSizePadding?: number;
        /**
          * Draws a filled select.
        */
        filled?: boolean;
        /**
          * Draws a pill-style select with rounded edges.
        */
        pill?: boolean;
        /**
          * The select's label. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * The preferred placement of the select's menu. Note that the actual placement may vary as needed to keep the listbox
 *  inside of the viewport.
        */
        placement?: 'top' | 'bottom';
        /**
          * The select's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * The select's required attribute.
        */
        required?: boolean;
        /**
          * When set to true, the select will use tag elements to render selected options regardless of the `multiple` property.
 *  This is useful when you want to display selected options in a more visually distinct way, such as in a tag format.
        */
        useTag?: boolean;
        /**
          * Behavior when typing into the display input
 * 
 *  @type {('select' | 'filter' | 'none')}
 *  'select': default shoelace behavior, selects the first option that starts with the typed string
 *  'filter': filters out options that do not include the typed string
 *  'none'  : does not do anything,      the user cannot type
        */
        inputBehavior?: 'none' | 'select' | 'filter';
        /**
          * 
        */
        stayOpenOnSelect?: boolean;
        /**
          * When set to true, the `cx-change` event will be emitted on every change of the value, even if the value is not changed.
        */
        forceOnChange?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary SpacingContainer allows for flexible layout spacing between child elements, vertically or horizontally, with varying sizes.
 * 
 *  @csspart base - The component's base container, applying flex layout.
            */
            interface CxSpaceAttributes extends HTMLAttributes<CxSpace> {
              
        /**
          * When set, and in vertical orientation, the child elements will stretch to fill the width of the container.
        */
        block?: boolean;
        /**
          * The direction of the spacing container. This will determine if the child elements are spaced vertically or horizontally.
        */
        direction?: 'horizontal' | 'vertical';
        /**
          * The spacing between child elements
        */
        spacing?: 'small' | 'medium' | 'large' | 'x-large' | 'x-small' | '3x-small' | '2x-small' | '2x-large' | '3x-large' | '4x-large';
        /**
          * The wrap behavior of the container.
        */
        wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
        /**
          * Proxy for justify-content CSS property.
        */
        justifyContent?: 'normal' | 'right' | 'left' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
        /**
          * Proxy for align-items CSS property.
        */
        alignItems?: 'normal' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'stretch' | 'baseline';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Tabs are used inside [tab groups](?s=atoms&id=/tab-group) to represent and activate [tab panels](?s=atoms&id=/tab-panel).
 * 
 *  @dependency cx-icon-button
 * 
 *  @slot - The tab's label.
 * 
 *  @event cx-close - Emitted when the tab is closable and the close button is activated.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart close-button - The close button, an `cx-icon-button`.
 *  @csspart close-button__base - The close button's exported `base` part.
            */
            interface CxTabAttributes extends HTMLAttributes<CxTab> {
              
        /**
          * The name of the tab panel this tab is associated with. The panel must be located in the same tab group.
        */
        panel?: string;
        /**
          * Draws the tab in an active state.
        */
        active?: boolean;
        /**
          * Makes the tab closable and shows a close button.
        */
        closable?: boolean;
        /**
          * Disables the tab and prevents selection.
        */
        disabled?: boolean;
        /**
          * @internal
 *  Need to wrap in a `@property()` otherwise CustomElement throws a "The result must not have attributes" runtime error.
        */
        tabIndex?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Tab panels are used inside [tab groups](?s=atoms&id=/tab-group) to display tabbed content.
 * 
 *  @slot - The tab panel's content.
 * 
 *  @csspart base - The component's base wrapper.
 * 
 *  @cssproperty --padding - The tab panel's padding.
            */
            interface CxTabPanelAttributes extends HTMLAttributes<CxTabPanel> {
              
        /**
          * The tab panel's name.
        */
        name?: string;
        /**
          * When true, the tab panel will be shown.
        */
        active?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Tab groups organize content into a container that shows one section at a time.
 * 
 *  @dependency cx-icon-button
 * 
 *  @slot - Used for grouping tab panels in the tab group. Must be `cx-tab-panel` elements.
 *  @slot nav - Used for grouping tabs in the tab group. Must be `cx-tab` elements.
 * 
 *  @event {{ name: String }} cx-tab-show - Emitted when a tab is shown.
 *  @event {{ name: String }} cx-tab-hide - Emitted when a tab is hidden.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart nav - The tab group's navigation container where tabs are slotted in.
 *  @csspart tabs - The container that wraps the tabs.
 *  @csspart active-tab-indicator - The line that highlights the currently selected tab.
 *  @csspart body - The tab group's body where tab panels are slotted in.
 *  @csspart scroll-button - The previous/next scroll buttons that show when tabs are scrollable, an `cx-icon-button`.
 *  @csspart scroll-button--start - The starting scroll button.
 *  @csspart scroll-button--end - The ending scroll button.
 *  @csspart scroll-button__base - The scroll button's exported `base` part.
 * 
 *  @cssproperty --indicator-color - The color of the active tab indicator.
 *  @cssproperty --track-color - The color of the indicator's track (the line that separates tabs from panels).
 *  @cssproperty --track-width - The width of the indicator's track (the line that separates tabs from panels).
            */
            interface CxTabGroupAttributes extends HTMLAttributes<CxTabGroup> {
              
        /**
          * The placement of the tabs.
        */
        placement?: 'top' | 'bottom' | 'start' | 'end';
        /**
          * When set to auto, navigating tabs with the arrow keys will instantly show the corresponding tab panel. When set to
 *  manual, the tab will receive focus but will not show until the user presses spacebar or enter.
        */
        activation?: 'auto' | 'manual';
        /**
          * Disables the scroll arrows that appear when tabs overflow.
        */
        noScrollControls?: boolean;
        /**
          * Prevent scroll buttons from being hidden when inactive.
        */
        fixedScrollControls?: boolean;
        /**
          * The variant of the tab group.
        */
        variant?: 'default' | 'button';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Confirm popover is a component that displays a confirmation dialog with a message and two action buttons.
 * 
 *  @dependency cx-dropdown
 *  @dependency cx-typography
 *  @dependency cx-button
 * 
 *  @event cx-confirm - The confirm button was clicked.
 *  @event cx-cancel - The cancel button was clicked.
 * 
 *  @slot trigger - The trigger element that opens the popover.
 *  @slot footer - The footer element that appears below the message and action buttons.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart content - The container that wraps the popover's content.
 *  @csspart actions - The container that wraps the action buttons.
 *  @csspart confirm-button - The confirm button.
 *  @csspart cancel-button - The cancel button.
 *  @csspart footer - The container that wraps the popover's footer.
 * 
 *  @cssproperty --size - The size of the avatar.
            */
            interface CxConfirmPopoverAttributes extends HTMLAttributes<CxConfirmPopover> {
              
        /**
          * The message to display in the confirmation dialog.
        */
        message?: string;
        /**
          * If true, when the trigger is clicked, the popover will not be shown. Instead, cx-confirm event will be emitted.
        */
        disabled?: boolean;
        /**
          * The variant of the confirm popover. It can be either 'dialog' or 'dropdown'.
        */
        variant?: 'dropdown' | 'dialog';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary File on Demand is a component that allows users to view and manage their assets.
 * 
 *  @dependency cx-typography
 *  @dependency cx-input
 *  @dependency cx-button
 *  @dependency cx-avatar
 *  @dependency cx-icon-button
 *  @dependency cx-relative-time
 *  @dependency cx-icon
 *  @dependency cx-tab
 *  @dependency cx-tab-group
 *  @dependency cx-tab-panel
 *  @dependency cx-format-bytes
 *  @dependency cx-progress-bar
 *  @dependency cx-line-clamp
 *  @dependency cx-tooltip
 *  @dependency cx-select
 *  @dependency cx-option
 *  @dependency cx-dialog
 * 
 *  @event {{ assetId: string }} cx-mark-favorite - Emitted when the user marks an asset as favorite.
 *  @event {{ assetId: string }} cx-unmark-favorite - Emitted when the user unmarks an asset as favorite.
 *  @event cx-open-search - Emitted when the user opens the search.
 *  @event {{ assetId: string }} cx-open-drive - Emitted when the user opens the drive.
 *  @event {{ type: string }} cx-load-more - Emitted when the user requests more assets.
 *  @event {{ connectUrl: string }} cx-connect - Emitted when the user requests to connect to the given connectionUrl.
 *  @event {{ connectUrl: string }} cx-disconnect - Emitted when the user requests to disconnect from the given connectionUrl.
 *  @event cx-clear-cache - Emitted when the user requests to clear the cache.
 *  @event cx-import-settings - Emitted when the user requests to import settings.
 *  @event cx-export-settings - Emitted when the user requests to export settings.
 *  @event cx-view-logs - Emitted when the user requests to view logs.
 *  @event cx-add-proxy-format-folders - Emitted when the user requests to add proxy format folders.
 *  @event {{ settings: Settings }} cx-save-settings - Emitted when the user saves the settings.
 *  @event cx-upgrade - Emitted when the user requests to upgrade the application.
 *  @event {{ assetId: string }} cx-retry-upload - Emitted when the user retries an upload.
 *  @event {{ assetId: string }} cx-pause-upload - Emitted when the user pauses an upload.
 *  @event {{ assetId: string }} cx-resume-upload - Emitted when the user resumes an upload.
 *  @event {{ assetId: string }} cx-cancel-upload - Emitted when the user cancels an upload.
 *  @event cx-renew-token - Emitted when fetch fails due to token expiration.
            */
            interface CxFileOnDemandAttributes extends HTMLAttributes<CxFileOnDemand> {
              
        /**
          * Indicates if the user is connected to the provided connection URL.
        */
        connectionEstablished?: boolean;
        /**
          * The connection status.
        */
        connectionStatus?: 'excellent' | 'good' | 'bad';
        /**
          * 
        */
        connectionStatusTooltip?: string;
        /**
          * The asset index sync status.
        */
        assetIndexSyncStatus?: 'error' | 'loading' | 'loaded';
        /**
          * The user's avatar URL.
        */
        userAvatarUrl?: string;
        /**
          * 
        */
        username?: string;
        /**
          * 
        */
        recentAssets?: CxFileOnDemandAssetsProp;
        /**
          * 
        */
        favoriteAssets?: CxFileOnDemandAssetsProp;
        /**
          * The last sync timestamp for favorite assets.
        */
        favoriteLastSync?: number;
        /**
          * The assets that are currently being marked/unmarked as favorite.
        */
        favoriteInProgressAssets?: string[];
        /**
          * 
        */
        uploadingAssets?: CxFileOnDemandAssetsProp;
        /**
          * 
        */
        settings?: CxFileOnDemandSettings;
        /**
          * Indicates if the application has a new version to upgrade to.
        */
        hasNewVersion?: boolean;
        /**
          * The about content to display in the settings view.
        */
        aboutContent?: string;
        /**
          * The authentication token to use for fetching data from OrangeDAM.
        */
        token?: string;
        /**
          * 
        */
        userInteractionBlocked?: boolean;
        /**
          * 
        */
        isConnecting?: boolean;
        /**
          * 
        */
        isCancellingConnection?: boolean;
        /**
          * 
        */
        isDisconnecting?: boolean;
        /**
          * 
        */
        isUpgrading?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Formats a date/time using the specified locale and options.
            */
            interface CxFormatDateAttributes extends HTMLAttributes<CxFormatDate> {
              
        /**
          * The date/time to format. If not set, the current date and time will be used. When passing a string, it's strongly
 *  recommended to use the ISO 8601 format to ensure timezones are handled correctly. To convert a date to this format
 *  in JavaScript, use [`date.toISOString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString).
        */
        date?: string;
        /**
          * The format for displaying the weekday.
        */
        weekday?: 'long' | 'short' | 'narrow';
        /**
          * The format for displaying the era.
        */
        era?: 'long' | 'short' | 'narrow';
        /**
          * The format for displaying the year.
        */
        year?: 'numeric' | '2-digit';
        /**
          * The format for displaying the month.
        */
        month?: 'numeric' | 'long' | 'short' | 'narrow' | '2-digit';
        /**
          * The format for displaying the day.
        */
        day?: 'numeric' | '2-digit';
        /**
          * The format for displaying the hour.
        */
        hour?: 'numeric' | '2-digit';
        /**
          * The format for displaying the minute.
        */
        minute?: 'numeric' | '2-digit';
        /**
          * The format for displaying the second.
        */
        second?: 'numeric' | '2-digit';
        /**
          * The format for displaying the time.
        */
        timeZoneName?: 'long' | 'short';
        /**
          * The time zone to express the time in.
        */
        timeZone?: string;
        /**
          * The format for displaying the hour.
        */
        hourFormat?: 'auto' | '12' | '24';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Formats a number using the specified locale and options.
            */
            interface CxFormatNumberAttributes extends HTMLAttributes<CxFormatNumber> {
              
        /**
          * The number to format.
        */
        value?: number;
        /**
          * The formatting style to use.
        */
        type?: 'decimal' | 'currency' | 'percent';
        /**
          * Turns off grouping separators.
        */
        noGrouping?: boolean;
        /**
          * The [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency code to use when formatting.
        */
        currency?: string;
        /**
          * How to display the currency.
        */
        currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
        /**
          * The minimum number of integer digits to use. Possible values are 1-21.
        */
        minimumIntegerDigits?: number;
        /**
          * The minimum number of fraction digits to use. Possible values are 0-20.
        */
        minimumFractionDigits?: number;
        /**
          * The maximum number of fraction digits to use. Possible values are 0-0.
        */
        maximumFractionDigits?: number;
        /**
          * The minimum number of significant digits to use. Possible values are 1-21.
        */
        minimumSignificantDigits?: number;
        /**
          * The maximum number of significant digits to use,. Possible values are 1-21.
        */
        maximumSignificantDigits?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The responsive layout grid adapts to screen size and orientation, ensuring consistency across layouts.
 * 
 *  @slot - The component's main content.
 * 
 *  @csspart content - The component's content.
            */
            interface CxGridAttributes extends HTMLAttributes<CxGrid> {
              
        /**
          * The space between children.
        */
        spacing?: string;
        /**
          * The number of columns to display.
        */
        columns?: number;
        /**
          * Whether to use flex gap or not.
        */
        useFlexGap?: boolean;
        /**
          * The space between columns. It overrides the value of the spacing prop.
        */
        columnSpacing?: string;
        /**
          * The space between rows. It overrides the value of the spacing prop.
        */
        rowSpacing?: string;
        /**
          * Defines the flex-wrap style property.
        */
        wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
        /**
          * Whether to use the "@container" query or not.
        */
        useContainer?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The item of a Grid layout.
 * 
 *  @slot - The component’s's main content.
 * 
 *  @csspart body -The component’s content
            */
            interface CxGridItemAttributes extends HTMLAttributes<CxGridItem> {
              
        /**
          * 
        */
        xs?: string;
        /**
          * 
        */
        sm?: string;
        /**
          * 
        */
        md?: string;
        /**
          * 
        */
        lg?: string;
        /**
          * 
        */
        xl?: string;
        /**
          * 
        */
        useContainer?: boolean;
        /**
          * 
        */
        fill?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxHeaderAttributes extends HTMLAttributes<CxHeader> {
              
        /**
          * 
        */
        variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        /**
          * 
        */
        hasAnchorLink?: boolean;
        /**
          * 
        */
        anchorLink?: string;
        /**
          * 
        */
        alignment?: 'center' | 'justify' | 'left' | 'right';
        /**
          * 
        */
        disabledCopyButton?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The `cx-hub-connection` component is used to establish a connection to a SignalR hub.
 *  https://learn.microsoft.com/en-us/javascript/api/%40microsoft/signalr/hubconnection?view=signalr-js-latest
            */
            interface CxHubConnectionAttributes extends HTMLAttributes<CxHubConnection> {
              
        /**
          * The url of the HubConnection to the server.
        */
        baseUrl?: string;
        /**
          * Default interval at which to ping the server in milliseconds.
        */
        keepAliveIntervalInMilliseconds?: number;
        /**
          * A boolean value that determines whether the negotiation step should be skipped when connecting to the server.
        */
        skipNegotiation?: boolean;
        /**
          * 
        */
        connectMode?: 'auto' | 'manual';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Compare visual differences between similar photos with a sliding panel.
 * 
 *  @dependency cx-icon
 * 
 *  @slot before - The before image, an `img` or `svg` element.
 *  @slot after - The after image, an `img` or `svg` element.
 *  @slot handle - The icon used inside the handle.
 * 
 *  @event cx-change - Emitted when the position changes.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart before - The container that wraps the before image.
 *  @csspart after - The container that wraps the after image.
 *  @csspart divider - The divider that separates the images.
 *  @csspart handle - The handle that the user drags to expose the after image.
 * 
 *  @cssproperty --divider-width - The width of the dividing line.
 *  @cssproperty --handle-size - The size of the compare handle.
            */
            interface CxImageComparerAttributes extends HTMLAttributes<CxImageComparer> {
              
        /**
          * The position of the divider as a percentage.
        */
        position?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Skeletons are used to provide a visual representation of where content will eventually be drawn.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart indicator - The skeleton's indicator which is responsible for its color and animation.
 * 
 *  @cssproperty --border-radius - The skeleton's border radius.
 *  @cssproperty --color - The color of the skeleton.
 *  @cssproperty --sheen-color - The sheen color when the skeleton is in its loading state.
            */
            interface CxSkeletonAttributes extends HTMLAttributes<CxSkeleton> {
              
        /**
          * Determines which effect the skeleton will use.
        */
        effect?: 'pulse' | 'none' | 'sheen';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxImageAttributes extends HTMLAttributes<CxImage> {
              
        /**
          * The path to the image to load.
        */
        src?: string;
        /**
          * The path to the placeholder image to be shown if src is not available.
        */
        placeholder?: string;
        /**
          * A description of the image used by assistive devices.
        */
        alt?: string;
        /**
          * The object-fit property of the image.
        */
        objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
        /**
          * Should the skeleton be shown when the image is loading.
        */
        skeleton?: boolean;
        /**
          * Determines if the image should be loaded lazily.
        */
        lazy?: boolean;
        /**
          * Should show the fallback image when the image fails to load.
        */
        fallback?: boolean;
        /**
          * The width of the image.
        */
        width?: string;
        /**
          * The height of the image.
        */
        height?: string;
        /**
          * Make the image resizable
        */
        resizable?: boolean;
        /**
          * Make the image resizable
        */
        keepRatio?: boolean;
        /**
          * 
        */
        noLimit?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Includes give you the power to embed external HTML files into the page.
 * 
 *  @event cx-load - Emitted when the included file is loaded.
 *  @event {{ status: number }} cx-error - Emitted when the included file fails to load due to an error.
            */
            interface CxIncludeAttributes extends HTMLAttributes<CxInclude> {
              
        /**
          * The location of the HTML file to include. Be sure you trust the content you are including as it will be executed as
 *  code and can result in XSS attacks.
        */
        src?: string;
        /**
          * The fetch mode to use.
        */
        mode?: 'cors' | 'no-cors' | 'same-origin';
        /**
          * Allows included scripts to be executed. Be sure you trust the content you are including as it will be executed as
 *  code and can result in XSS attacks.
        */
        allowScripts?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Input groups can be used to group related inputs into sections.
 * 
 *  @slot - One or more `cx-input` elements to display in the input group.
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxInputGroupAttributes extends HTMLAttributes<CxInputGroup> {
              
        /**
          * A label to use for the input group. This won't be displayed on the screen, but it will be announced by assistive
 *  devices when interacting with the control and is strongly recommended.
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxMasonryAttributes extends HTMLAttributes<CxMasonry> {
              
        /**
          * 
        */
        data?: CxMasonryMasonryItem[];
        /**
          * 
        */
        variant?: 'masonry' | 'standard';
        /**
          * 
        */
        cols?: number;
        /**
          * 
        */
        rowHeight?: string;
        /**
          * 
        */
        actions?: CxMasonryMasonryItemAction[];
        /**
          * 
        */
        sortable?: boolean;
        /**
          * The spacing between child elements
        */
        spacing?: 'small' | 'medium' | 'large' | 'x-large' | 'x-small' | '3x-small' | '2x-small' | '2x-large' | '3x-large' | '4x-large';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Menu labels are used to describe a group of menu items.
 * 
 *  @slot - The menu label's content.
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxMenuLabelAttributes extends HTMLAttributes<CxMenuLabel> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Menu sections provide a mean for grouping together related menu items.
 * 
 *  @slot - The menu items in the section.
            */
            interface CxMenuSectionAttributes extends HTMLAttributes<CxMenuSection> {
              
        /**
          * 
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The Mutation Observer component offers a thin, declarative interface to the [`MutationObserver API`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).
 * 
 *  @event {{ mutationList: MutationRecord[] }} cx-mutation - Emitted when a mutation occurs.
 * 
 *  @slot - The content to watch for mutations.
            */
            interface CxMutationObserverAttributes extends HTMLAttributes<CxMutationObserver> {
              
        /**
          * Watches for changes to attributes. To watch only specific attributes, separate them by a space, e.g.
 *  `attr="class id title"`. To watch all attributes, use `*`.
        */
        attr?: string;
        /**
          * Indicates whether or not the attribute's previous value should be recorded when monitoring changes.
        */
        attrOldValue?: boolean;
        /**
          * Watches for changes to the character data contained within the node.
        */
        charData?: boolean;
        /**
          * Indicates whether or not the previous value of the node's text should be recorded.
        */
        charDataOldValue?: boolean;
        /**
          * Watches for the addition or removal of new child nodes.
        */
        childList?: boolean;
        /**
          * Disables the observer.
        */
        disabled?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Pagination component displays the current page and allows the user to navigate through pages.
 * 
 * 
 *  @dependency cx-icon-button
 *  @dependency cx-option
 *  @dependency cx-select
 *  @dependency cx-typography
 * 
 * 
 *  @event {{ pageIndex: number, rowsPerPage: number }} cx-page-change - Emitted when the active page changes.
            */
            interface CxPaginationAttributes extends HTMLAttributes<CxPagination> {
              
        /**
          * The total number of items
        */
        count?: number;
        /**
          * The options for the number of items per page
        */
        rowsPerPageOptions?: number[];
        /**
          * The current number of items per page
        */
        rowsPerPage?: number;
        /**
          * 
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Progress rings are used to show the progress of a determinate operation in a circular fashion.
 * 
 *  @slot - A label to show inside the ring.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart label - The progress ring label.
 * 
 *  @cssproperty --size - The diameter of the progress ring (cannot be a percentage).
 *  @cssproperty --track-width - The width of the track.
 *  @cssproperty --track-color - The color of the track.
 *  @cssproperty --indicator-width - The width of the indicator. Defaults to the track width.
 *  @cssproperty --indicator-color - The color of the indicator.
 *  @cssproperty --indicator-transition-duration - The duration of the indicator's transition when the value changes.
            */
            interface CxProgressRingAttributes extends HTMLAttributes<CxProgressRing> {
              
        /**
          * The current progress as a percentage, 0 to 100.
        */
        value?: number;
        /**
          * A custom label for assistive devices.
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Generates a [QR code](https://www.qrcode.com/) and renders it using the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxQrCodeAttributes extends HTMLAttributes<CxQrCode> {
              
        /**
          * The QR code's value.
        */
        value?: string;
        /**
          * The label for assistive devices to announce. If unspecified, the value will be used instead.
        */
        label?: string;
        /**
          * The size of the QR code, in pixels.
        */
        size?: number;
        /**
          * The fill color. This can be any valid CSS color, but not a CSS custom property.
        */
        fill?: string;
        /**
          * The background color. This can be any valid CSS color or `transparent`. It cannot be a CSS custom property.
        */
        background?: string;
        /**
          * The edge radius of each module. Must be between 0 and 0.5.
        */
        radius?: number;
        /**
          * The level of error correction to use. [Learn more](https://www.qrcode.com/en/about/error_correction.html)
        */
        errorCorrection?: 'L' | 'M' | 'Q' | 'H';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Radios allow the user to select a single option from a group.
 * 
 *  @dependency cx-icon
 * 
 *  @slot - The radio's label.
 * 
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-focus - Emitted when the control gains focus.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart control - The circular container that wraps the radio's checked state.
 *  @csspart control--checked - The radio control when the radio is checked.
 *  @csspart checked-icon - The checked icon, an `cx-icon` element.
 *  @csspart label - The container that wraps the radio's label.
            */
            interface CxRadioAttributes extends HTMLAttributes<CxRadio> {
              
        /**
          * The radio's value. When selected, the radio group will receive this value.
        */
        value?: string;
        /**
          * The radio's size. When used inside a radio group, the size will be determined by the radio group's size so this
 *  attribute can typically be omitted.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Disables the radio.
        */
        disabled?: boolean;
        /**
          * Hides the radio's indicator.
        */
        hideIndicator?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Radios buttons allow the user to select a single option from a group using a button-like control.
 * 
 *  @slot - The radio button's label.
 *  @slot prefix - A presentational prefix icon or similar element.
 *  @slot suffix - A presentational suffix icon or similar element.
 * 
 *  @event cx-blur - Emitted when the button loses focus.
 *  @event cx-focus - Emitted when the button gains focus.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart button - The internal `button` element.
 *  @csspart button--checked - The internal button element when the radio button is checked.
 *  @csspart prefix - The container that wraps the prefix.
 *  @csspart label - The container that wraps the radio button's label.
 *  @csspart suffix - The container that wraps the suffix.
            */
            interface CxRadioButtonAttributes extends HTMLAttributes<CxRadioButton> {
              
        /**
          * @internal The radio button's checked state. This is exposed as an "internal" attribute so we can reflect it, making
 *  it easier to style in button groups.
        */
        checked?: boolean;
        /**
          * The radio's value. When selected, the radio group will receive this value.
        */
        value?: string;
        /**
          * Disables the radio button.
        */
        disabled?: boolean;
        /**
          * The radio button's size. When used inside a radio group, the size will be determined by the radio group's size so
 *  this attribute can typically be omitted.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Draws a pill-style radio button with rounded edges.
        */
        pill?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxRadioCardAttributes extends HTMLAttributes<CxRadioCard> {
              
        /**
          * The radio's value. When selected, the radio group will receive this value.
        */
        value?: string;
        /**
          * Disables the radio.
        */
        disabled?: boolean;
        /**
          * Hides the radio's indicator.
        */
        hideIndicator?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Radio groups are used to group multiple [radios](?s=atoms&id=/radio) or [radio buttons](?s=atoms&id=/radio-button) so they function as a single form control.
 * 
 *  @dependency cx-button-group
 * 
 *  @slot - The default slot where `cx-radio` or `cx-radio-button` elements are placed.
 *  @slot label - The radio group's label. Required for proper accessibility. Alternatively, you can use the `label`
 *   attribute.
 *  @slot help-text - Text that describes how to use the radio group. Alternatively, you can use the `help-text` attribute.
 * 
 *  @event cx-change - Emitted when the radio group's selected value changes.
 *  @event cx-input - Emitted when the radio group receives user input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @csspart form-control - The form control that wraps the label, input, and help text.
 *  @csspart form-control-label - The label's wrapper.
 *  @csspart form-control-input - The input's wrapper.
 *  @csspart form-control-help-text - The help text's wrapper.
 *  @csspart button-group - The button group that wraps radio buttons.
 *  @csspart button-group__base - The button group's `base` part.
            */
            interface CxRadioGroupAttributes extends HTMLAttributes<CxRadioGroup> {
              
        /**
          * The radio group's label. Required for proper accessibility. If you need to display HTML, use the `label` slot
 *  instead.
        */
        label?: string;
        /**
          * The radio groups's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * The name of the radio group, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the radio group, submitted as a name/value pair with form data.
        */
        value?: string;
        /**
          * The radio group's size. This size will be applied to all child radios and radio buttons.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Ensures a child radio is checked before allowing the containing form to submit.
        */
        required?: boolean;
        /**
          * Arrange the radio buttons in a horizontal layout, making them appear side by side instead of stacked vertically.
        */
        horizontal?: boolean;
        /**
          * This attribute disables the spacing behavior of the radio group.
        */
        compact?: boolean;
        /**
          * This attribute specifies the number of items to be displayed per row. It is only applicable when the `horizontal` attribute is set to true.
        */
        itemsPerRow?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Ranges allow the user to select a single value within a given range using a slider.
 * 
 *  @slot label - The range's label. Alternatively, you can use the `label` attribute.
 *  @slot help-text - Text that describes how to use the input. Alternatively, you can use the `help-text` attribute.
 * 
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-change - Emitted when an alteration to the control's value is committed by the user.
 *  @event cx-focus - Emitted when the control gains focus.
 *  @event cx-input - Emitted when the control receives input.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 *  @event cx-drag-start - Emitted when the user starts dragging the thumb.
 *  @event cx-drag-end - Emitted when the user stops dragging the thumb.
 * 
 *  @csspart form-control - The form control that wraps the label, input, and help text.
 *  @csspart form-control-label - The label's wrapper.
 *  @csspart form-control-input - The range's wrapper.
 *  @csspart form-control-help-text - The help text's wrapper.
 *  @csspart base - The component's base wrapper.
 *  @csspart input - The internal `input` element.
 *  @csspart tooltip - The range's tooltip.
 * 
 *  @cssproperty --thumb-size - The size of the thumb.
 *  @cssproperty --track-color-active - The color of the portion of the track that represents the current value.
 *  @cssproperty --track-color-inactive - The of the portion of the track that represents the remaining value.
 *  @cssproperty --track-height - The height of the track.
 *  @cssproperty --track-active-offset - The point of origin of the active track.
            */
            interface CxRangeAttributes extends HTMLAttributes<CxRange> {
              
        /**
          * Sets the dragging state for the component. This allows us to control the style in CSS.
        */
        state?: 'dragging' | 'idle';
        /**
          * 
        */
        title?: string;
        /**
          * make reactive to pass through The name of the range, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the range, submitted as a name/value pair with form data.
        */
        value?: number;
        /**
          * The range's label. If you need to display HTML, use the `label` slot instead.
        */
        label?: string;
        /**
          * The range's help text. If you need to display HTML, use the help-text slot instead.
        */
        helpText?: string;
        /**
          * Disables the range.
        */
        disabled?: boolean;
        /**
          * The minimum acceptable value of the range.
        */
        min?: number;
        /**
          * The maximum acceptable value of the range.
        */
        max?: number;
        /**
          * The interval at which the range will increase and decrease.
        */
        step?: number;
        /**
          * The preferred placement of the range's tooltip.
        */
        tooltipPlacement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
        /**
          * Controls when the tooltip is displayed:
 * - on: always displayed.
 * - off: never displayed.
 * - auto: displayed on hover or focus.
        */
        tooltipDisplay?: 'auto' | 'off' | 'on';
        /**
          * Controls the `hoist` attribute of the tooltip.
        */
        tooltipHoist?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * How close the thumb must be to a mark until snapping occurs.
        */
        snapThreshold?: number;
        /**
          * Displays a tick mark for each step in the range. If no `marks` slot is provided, marks will be auto-generated using the `step` value.
        */
        showMarks?: boolean;
        /**
          * The offset of the tooltip from the thumb.
        */
        tooltipOffset?: number;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultValue?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Ratings give users a way to quickly view and provide feedback.
 * 
 *  @dependency cx-icon
 * 
 *  @event cx-change - Emitted when the rating's value changes.
 *  @event {{ phase: 'start' | 'move' | 'end', value: number }} cx-hover - Emitted when the user hovers over a value. The
 *   `phase` property indicates when hovering starts, moves to a new value, or ends. The `value` property tells what the
 *   rating's value would be if the user were to commit to the hovered value.
 * 
 *  @csspart base - The component's base wrapper.
 * 
 *  @cssproperty --symbol-color - The inactive color for symbols.
 *  @cssproperty --symbol-color-active - The active color for symbols.
 *  @cssproperty --symbol-size - The size of symbols.
 *  @cssproperty --symbol-spacing - The spacing to use around symbols.
            */
            interface CxRatingAttributes extends HTMLAttributes<CxRating> {
              
        /**
          * A label that describes the rating to assistive devices.
        */
        label?: string;
        /**
          * The current rating.
        */
        value?: number;
        /**
          * The highest rating to show.
        */
        max?: number;
        /**
          * The precision at which the rating will increase and decrease. For example, to allow half-star ratings, set this
 *  attribute to `0.5`.
        */
        precision?: number;
        /**
          * Makes the rating readonly.
        */
        readonly?: boolean;
        /**
          * Disables the rating.
        */
        disabled?: boolean;
        /**
          * Variant
        */
        variant?: 'outlined' | 'default';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Split panels display two adjacent panels, allowing the user to reposition them.
 * 
 *  @event cx-reposition - Emitted when the divider's position changes.
 * 
 *  @slot start - Content to place in the start panel.
 *  @slot end - Content to place in the end panel.
 *  @slot divider - The divider. Useful for slotting in a custom icon that renders as a handle.
 * 
 *  @csspart start - The start panel.
 *  @csspart end - The end panel.
 *  @csspart panel - Targets both the start and end panels.
 *  @csspart divider - The divider that separates the start and end panels.
 * 
 *  @cssproperty [--divider-width=4px] - The width of the visible divider.
 *  @cssproperty [--divider-hit-area=12px] - The invisible region around the divider where dragging can occur. This is
 *   usually wider than the divider to facilitate easier dragging.
 *  @cssproperty [--min=0] - The minimum allowed size of the primary panel.
 *  @cssproperty [--max=100%] - The maximum allowed size of the primary panel.
            */
            interface CxSplitPanelAttributes extends HTMLAttributes<CxSplitPanel> {
              
        /**
          * The current position of the divider from the primary panel's edge as a percentage 0-100. Defaults to 50% of the
 *  container's initial size.
        */
        position?: number;
        /**
          * The current position of the divider from the primary panel's edge in pixels.
        */
        positionInPixels?: number;
        /**
          * Draws the split panel in a vertical orientation with the start and end panels stacked.
        */
        vertical?: boolean;
        /**
          * Disables resizing. Note that the position may still change as a result of resizing the host element.
        */
        disabled?: boolean;
        /**
          * If no primary panel is designated, both panels will resize proportionally when the host element is resized. If a
 *  primary panel is designated, it will maintain its size and the other panel will grow or shrink as needed when the
 *  host element is resized.
        */
        primary?: 'start' | 'end';
        /**
          * Sets the dragging state for the component. This allows us to control the style in CSS.
        */
        state?: 'dragging' | 'idle';
        /**
          * One or more space-separated values at which the divider should snap. Values can be in pixels or percentages, e.g.
 *  `"100px 50%"`.
        */
        snap?: string;
        /**
          * How close the divider must be to a snap point until snapping occurs.
        */
        snapThreshold?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxStepAttributes extends HTMLAttributes<CxStep> {
              
        /**
          * 
        */
        active?: boolean;
        /**
          * 
        */
        completed?: boolean;
        /**
          * 
        */
        disabled?: boolean;
        /**
          * 
        */
        readonly?: boolean;
        /**
          * 
        */
        error?: boolean;
        /**
          * 
        */
        index?: number;
        /**
          * 
        */
        last?: boolean;
        /**
          * 
        */
        helpText?: string;
        /**
          * 
        */
        progress?: number;
        /**
          * 
        */
        color?: string;
        /**
          * 
        */
        round?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxStepperAttributes extends HTMLAttributes<CxStepper> {
              
        /**
          * 
        */
        direction?: 'horizontal' | 'vertical';
        /**
          * 
        */
        itemsPerRow?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Switches allow the user to toggle an option on or off.
 * 
 *  @slot - The switch's label.
 *  @slot help-text - Text that describes how to use the switch. Alternatively, you can use the `help-text` attribute.
 *  @slot checked-icon - Thumb icon when the switch is checked.
 *  @slot unchecked-icon - Thumb icon when the switch is unchecked.
 * 
 *  @event cx-blur - Emitted when the control loses focus.
 *  @event cx-change - Emitted when the control's checked state changes.
 *  @event cx-input - Emitted when the control receives input.
 *  @event cx-focus - Emitted when the control gains focus.
 *  @event cx-invalid - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart control - The control that houses the switch's thumb.
 *  @csspart thumb - The switch's thumb.
 *  @csspart label - The switch's label.
 *  @csspart form-control-help-text - The help text's wrapper.
 * 
 *  @cssproperty --width - The width of the switch.
 *  @cssproperty --height - The height of the switch.
 *  @cssproperty --thumb-size - The size of the thumb.
            */
            interface CxSwitchAttributes extends HTMLAttributes<CxSwitch> {
              
        /**
          * 
        */
        title?: string;
        /**
          * make reactive to pass through The name of the switch, submitted as a name/value pair with form data.
        */
        name?: string;
        /**
          * The current value of the switch, submitted as a name/value pair with form data.
        */
        value?: string;
        /**
          * The switch's size.
        */
        size?: 'small' | 'medium' | 'large';
        /**
          * Disables the switch.
        */
        disabled?: boolean;
        /**
          * Draws the switch in a checked state.
        */
        checked?: boolean;
        /**
          * The default value of the form control. Primarily used for resetting the form control.
        */
        defaultChecked?: boolean;
        /**
          * By default, form controls are associated with the nearest containing `form` element. This attribute allows you
 *  to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
 *  the same document or shadow root for this to work.
        */
        form?: string;
        /**
          * Makes the switch a required field.
        */
        required?: boolean;
        /**
          * Whether to display icon on the switch's thumb.
        */
        showIcon?: boolean;
        /**
          * The switch's help text. If you need to display HTML, use the `help-text` slot instead.
        */
        helpText?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxVideoAttributes extends HTMLAttributes<CxVideo> {
              
        /**
          * The path to the video to load.
        */
        src?: string;
        /**
          * The mime type of the video.
        */
        type?: string;
        /**
          * The poster image to show before the video loads.
        */
        poster?: string;
        /**
          * Determines if the video should autoplay.
        */
        autoplay?: boolean;
        /**
          * Determines if the video should loop.
        */
        loop?: boolean;
        /**
          * Determines if the video should be muted.
        */
        muted?: boolean;
        /**
          * Determines if the controls should be shown.
        */
        showControls?: boolean;
        /**
          * The width of the image.
        */
        width?: string;
        /**
          * The height of the image.
        */
        height?: string;
        /**
          * Make the image resizable
        */
        resizable?: boolean;
        /**
          * Make the image resizable
        */
        keepRatio?: boolean;
        /**
          * 
        */
        noLimit?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Represents a layout with up-to-2 sidebars of fixed width, and the main content takes up the rest of the available space.
 * 
 *  @slot - The main content.
 *  @slot left - Left sidebar content.
 *  @slot right - Right sidebar content.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart left-container - The container that wraps the left sidebar.
 *  @csspart right-container - The container that wraps the right sidebar.
 *  @csspart content - The container that wraps the main content.
            */
            interface CxSidebarLayoutAttributes extends HTMLAttributes<CxSidebarLayout> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxBicolorPickerAttributes extends HTMLAttributes<CxBicolorPicker> {
              
        /**
          * 
        */
        value?: string[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxBorderInputGroupAttributes extends HTMLAttributes<CxBorderInputGroup> {
              
        /**
          * 
        */
        value?: string[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The cx-color-swatch component is used to display the color and its color codes.
 * 
 *  @dependency cx-copy-button
 *  @dependency cx-resize-observer
 *  @dependency cx-space
 *  @dependency cx-typography
 * 
 *  @cssproperty --max-width - Maximum width of color swatch container
 *  @cssproperty --min-width - Minimum width of color swatch container
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart name - The color swatch's name wrapper.
 *  @csspart content - The container that wraps the main content.
 *  @csspart item - Each row in main content.
 *  @csspart key - Constant key in information row.
 *  @csspart copy-button - Copy button in information row.
 *  @csspart value - Value in information row.
            */
            interface CxColorSwatchAttributes extends HTMLAttributes<CxColorSwatch> {
              
        /**
          * Color swatch variant
        */
        variant?: 'circle' | 'grid-item';
        /**
          * Name of swatch
        */
        name?: string;
        /**
          * Hex code color of swatch
        */
        hex?: string;
        /**
          * RGB code color of swatch
        */
        rgb?: string;
        /**
          * Cmyk code color of swatch
        */
        cmyk?: string;
        /**
          * Pms code color of swatch
        */
        pms?: string;
        /**
          * Make color codes copyable
        */
        canCopy?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxCropperAttributes extends HTMLAttributes<CxCropper> {
              
        /**
          * 
        */
        cropper?: { height: number; percentageHeight: number; percentageWidth: number; width: number; x: number; y: number; };
        /**
          * 
        */
        image?: { extension: string; height: number; originalUrl: string; rotation: number; url: string; width: number; x: number; y: number; };
        /**
          * 
        */
        resizer?: { height: number; width: number; };
        /**
          * 
        */
        rotation?: number;
        /**
          * 
        */
        disabled?: boolean;
        /**
          * 
        */
        loadable?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxFolderSelectAttributes extends HTMLAttributes<CxFolderSelect> {
              
        /**
          * 
        */
        minQueryLength?: number;
        /**
          * 
        */
        selection?: 'multiple' | 'single';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary
 * 
 *  @event
            */
            interface CxGraphViewAttributes extends HTMLAttributes<CxGraphView> {
              
        /**
          * 
        */
        data?: CxGraphViewWorkflow;
        /**
          * 
        */
        readonly?: boolean;
        /**
          * 
        */
        hideControls?: boolean;
        /**
          * 
        */
        renderDelay?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxPaddingInputGroupAttributes extends HTMLAttributes<CxPaddingInputGroup> {
              
        /**
          * 
        */
        value?: string[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxShadowInputGroupAttributes extends HTMLAttributes<CxShadowInputGroup> {
              
        /**
          * 
        */
        value?: string[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Represents a sidebar in a sidebar layout.
 * 
 *  @dependency cx-divider
 *  @dependency cx-icon-button
 * 
 *  @slot - The main content.
 *  @slot header - The header.
 *  @slot open_trigger - The label of the open trigger.
 * 
 *  @event cx-after-resize {{ side: 'left' | 'right', size: number }} - Emitted after the sidebar is resized.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart header - The container that wraps the header.
 *  @csspart content - The container that wraps the main content.
            */
            interface CxSidebarAttributes extends HTMLAttributes<CxSidebar> {
              
        /**
          * Sets the side for the component.
        */
        side?: 'right' | 'left';
        /**
          * Is the sidebar open?
        */
        open?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxStepperWizardAttributes extends HTMLAttributes<CxStepperWizard> {
              
        /**
          * 
        */
        data?: CxStepperWizardStepData[];
        /**
          * 
        */
        maxWidth?: number;
        /**
          * 
        */
        minWidth?: number;
        /**
          * 
        */
        disabled?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxStorybookAttributes extends HTMLAttributes<CxStorybook> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The `cx-asset-link-format` component is used to format an asset link with various transformations such as cropping, resizing, rotating, and applying quality settings.
 * 
 *  @dependency cx-asset-link-format-crop
 *  @dependency cx-asset-link-format-extension
 *  @dependency cx-asset-link-format-metadata
 *  @dependency cx-asset-link-format-proxy
 *  @dependency cx-asset-link-format-quality
 *  @dependency cx-asset-link-format-resize
 *  @dependency cx-asset-link-format-rotation
 * 
 *  @event `cx-asset-link-format-change` - Emitted when the asset link format is changed.
            */
            interface CxAssetLinkFormatAttributes extends HTMLAttributes<CxAssetLinkFormat> {
              
        /**
          * The base URL for the asset service.
 *  This URL is used to fetch the asset link and apply transformations.
 *  This is useful for integration with different environments that are outside of the Orange Logic platform, such as Content Browser SDK.
 *  If not provided, the component will use the current window location as the base URL.
 *  @example 'https://qa-latest.orangelogic.com'
 *  @default undefined
        */
        baseUrl?: string;
        /**
          * The access token for the asset service.
 *  This token is used to authenticate requests to the asset service.
 *  This is useful for integration with different environments that are outside of the Orange Logic platform, such as Content Browser SDK.
 *  If not provided, the component will not include an access token in requests.
 *  @default undefined
        */
        accessToken?: string;
        /**
          * The asset to be formatted.
 *  This is an object that contains the asset's details such as ID, original URL, image URL, width, and height.
 *  This property is required for the component to function correctly.
 *  @default undefined
        */
        asset?: CxAssetLinkFormatAsset;
        /**
          * The list of available file extensions for the asset.
 *  This is an array of objects, each containing a `displayName` and a `value`.
 *  The `displayName` is the name displayed in the dropdown, and the `value` is the actual file extension.
 *  @default []
        */
        extensions?: { displayName: string; value: string; }[];
        /**
          * The list of available proxies for the asset.
 *  This is an array of objects, each containing details about the proxy such as `id`, `proxyName`, `formatWidth`, and `formatHeight`.
 *  This property is used to select different formats for the asset.
 *  @default []
        */
        proxies?: CxAssetLinkFormatProxy[];
        /**
          * The selector for the cropper element.
 *  This is used to link the cropper functionality with the asset link format component.
 *  If not provided, the component will not use a cropper.
 *  @default undefined
        */
        forCropper?: string;
        /**
          * The session identifier to be used for the asset link.
 *  This is useful for working with Orange Logic platform's sessions.
 *  @default ''
        */
        useSession?: string;
        /**
          * The list of transformations applied to the asset link.
 *  This is an array of objects, each containing a `key` (the type of transformation) and a `value` (the parameters for the transformation).
 *  This property is used to keep track of all transformations applied to the asset link.
 *  Making this a property allows for easy syncing with the backend code.
 *  @default []
        */
        transformations?: CxAssetLinkFormatTransformation[];
        /**
          * The ID of the selected proxy format.
 *  This is a string that represents the ID of the selected proxy format from the list of available proxies.
 *  @default '''
        */
        proxy?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Widget for managing cluster. Pure web component version of orangelogic.react.clustermanagement.
 * 
 *  @event cx-refresh - Emitted when a data refresh has been made.
 * 
 *  @csspart base - The component's base wrapper.
 *  @csspart spinner - The spinner that gets displayed when no data is available yet.
 *  @csspart alert - The alert that gets displayed when an error occurs.
 *  @csspart service - The container that wraps around each service.
 *  @csspart service__label - The label for each service.
 *  @csspart service__range - The wrapper around each service's range sliders.
 *  @csspart service__running-range - Each service's range slider for the currently running count.
 *  @csspart service__desired-range - Each service's range slider for the desired count.
 *  @csspart status - The container that wraps the status date and refresh button.
 *  @csspart status__refresh-button - The button to refresh the data.
 *  @csspart status__refresh-spinner - The spinner that gets displayed when data is being refreshed.
 *  @csspart dialog - The dialog that gets displayed when confirming a change.
 *  @csspart dialog__confirm-button - The confirm button inside the confirmation dialog.
 *  @csspart dialog__cancel-button - The cancel button inside the confirmation dialog.
 * 
 *  @dependency cx-alert
 *  @dependency cx-icon
 *  @dependency cx-spinner
 *  @dependency cx-range
 *  @dependency cx-icon-button
 *  @dependency cx-dialog
 *  @dependency cx-format-date
            */
            interface CxClusterManagementAttributes extends HTMLAttributes<CxClusterManagement> {
              
        /**
          * How many seconds between each automatic data refresh
        */
        refreshInterval?: number;
        /**
          * If true, the component is in readonly mode. No changes can be made to the service counts.
        */
        readonly?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Display a group of color swatch.
 * 
 *  @dependency cx-color-swatch
 *  @dependency cx-resize-observer
 *  @dependency cx-space
 * 
 *  @cssproperty --padding - Padding of the container
 *  @cssproperty --gap - Gap size for Grid variant (horizontal & vertical)
 *  @cssproperty --margin-left - Left side overlap for the Circle variant
 * 
 *  @csspart base - The component's base wrapper.
            */
            interface CxColorSwatchGroupAttributes extends HTMLAttributes<CxColorSwatchGroup> {
              
        /**
          * Color swatch group variant
        */
        variant?: 'circles' | 'grid';
        /**
          * A json string of an array of color swatch data
        */
        data?: CxColorSwatchGroupColorSwatchData[];
        /**
          * Maximum number of columns to display, this applies to grid variant only
 *  In smaller screen sizes, the color swatch boxes automatically drop down if there is no available spaces
        */
        maxCol?: number;
        /**
          * If all color swatches' color code can be copied
        */
        canCopy?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxCommentAttributes extends HTMLAttributes<CxComment> {
              
        /**
          * 
        */
        content?: string;
        /**
          * 
        */
        editable?: boolean;
        /**
          * 
        */
        autofocus?: boolean;
        /**
          * 
        */
        canUpload?: boolean;
        /**
          * 
        */
        canUseAiAssistant?: boolean;
        /**
          * 
        */
        recording?: boolean;
        /**
          * 
        */
        queryName?: string;
        /**
          * 
        */
        filterName?: string;
        /**
          * 
        */
        autocompletionViewstate?: string;
        /**
          * 
        */
        maxCount?: number;
        /**
          * 
        */
        queryDelay?: number;
        /**
          * 
        */
        minQueryLength?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxRteCodeBlockToolbarAttributes extends HTMLAttributes<CxRteCodeBlockToolbar> {
              
        /**
          * 
        */
        language?: string;
        /**
          * 
        */
        languages?: string[];
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxColumnAttributes extends HTMLAttributes<CxColumn> {
              
        /**
          * 
        */
        selected?: boolean;
        /**
          * 
        */
        resizable?: boolean;
        /**
          * 
        */
        trigger?: 'manual' | 'hover';
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxColumnGroupAttributes extends HTMLAttributes<CxColumnGroup> {
              
        /**
          * 
        */
        columnWidths?: number[];
        /**
          * 
        */
        trigger?: 'manual' | 'hover';
        /**
          * 
        */
        auto?: boolean;
        /**
          * 
        */
        minColumnWidth?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxTextAttributes extends HTMLAttributes<CxText> {
              
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary The `cx-content-builder` component is used to create and manage content blocks in a CMS.
 * 
 *  @dependency cx-block-picker
 *  @dependency cx-config-manager
 *  @dependency cx-rte-bubble-menu
 *  @dependency cx-rte-table-generator
 *  @dependency cx-spinner
 * 
 *  @event cx-change - Emitted when the content builder changes.
            */
            interface CxContentBuilderAttributes extends HTMLAttributes<CxContentBuilder> {
              
        /**
          * Dark mode
 *  @default false
        */
        darkMode?: boolean;
        /**
          * Initial data for the content builder
 *  This should be a JSON string representing the initial state of the content builder.
 *  @default ''
        */
        initialData?: string;
        /**
          * This property reflects the current device type being used in the content builder.
 *  It can be one of the predefined device types such as 'desktop', 'tablet', or 'mobile'.
 *  @default 'desktop'
        */
        device?: string;
        /**
          * List of devices available in the content builder.
 *  This is an array of device objects that define the different devices that can be used in the content builder.
 *  Each device object should have properties like `name`, `canvasWidth`, `maxWidth`, etc.
 *  @default AllDevices
        */
        devices?: CxContentBuilderDevice[];
        /**
          * Source URL for the canvas
 *  This is the URL that will be used as the source for the canvas in the content builder.
 *  If this is set, the content builder will not render automatically and will use the provided canvas source.
 *  @default undefined
        */
        canvasSrc?: string;
        /**
          * Selector for the container element
 *  This is the CSS selector that will be used to find the container element for the content builder.
 *  If this is set, the content builder will use the specified container instead of the default one.
 *  @default undefined
        */
        containerSelector?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Downloader, but web component.
 * 
 *  @dependency cx-icon-button
 *  @dependency cx-input
 *  @dependency cx-icon
 *  @dependency cx-button
 *  @dependency cx-spinner
 *  @dependency cx-tooltip
 *  @dependency cx-menu
 *  @dependency cx-menu-item
 *  @dependency cx-switch
 *  @dependency cx-range
 *  @dependency cx-dropdown
 *  @dependency cx-progress-bar
 *  @dependency cx-badge
 *  @dependency cx-dialog
 *  @dependency cx-divider
 *  @dependency cx-checkbox
 *  @dependency cx-pagination
 *  @dependency cx-typography
            */
            interface CxDownloaderAttributes extends HTMLAttributes<CxDownloader> {
              
        /**
          * 
        */
        ctx?: CxDownloaderExecutionContext;
        /**
          * 
        */
        userId?: string;
        /**
          * 
        */
        workerURL?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Multi-select allows the user to select multiple items from a list. The items can be moved between two columns. The user can move items between the columns by dragging and dropping them.
 *  @element cx-multi-select
 * 
 *  @event {{ items: BoardItem[], name: string }} cx-multi-select-change - Emitted when the list items change.
            */
            interface CxMultiSelectAttributes extends HTMLAttributes<CxMultiSelect> {
              
        /**
          * 
        */
        firstColumnData?: CxMultiSelectColumnData;
        /**
          * 
        */
        secondColumnData?: CxMultiSelectColumnData;
        /**
          * 
        */
        configurable?: boolean;
        /**
          * 
        */
        ignoredTypes?: string[];
        /**
          * 
        */
        addLimit?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @class CxTemplateSwitcher
 *  @extends CortexElement
 *  @summary Custom web component for switching templates in the Cortex application. The component manages various settings and menu configurations for different views, sort orders, and other options.
 * 
 *  @property {TemplateSwitcherProps} data - The data object containing initial settings and other configurations.
 *  @property {boolean | null} forcedSortOrder - Indicates if the sort order is forced.
 *  @property {string | null} forcedSortOrderReason - The reason for forcing the sort order.
 *  @property {MenuData} _menu - Internal state to store the menu data.
 *  @property {Settings} _settings - Internal state to store the settings.
 *  @property {boolean} _loading - Internal state to indicate if the component is loading.
 * 
 *  @method handleDataChange - Handles changes to the `data` property and updates settings accordingly.
 *  @method handleSettingsChange - Handles changes to the `_settings` property and updates the menu.
 *  @method handleAddCortexEvent - Adds a Cortex event using the provided event name and value.
 *  @method handleItemSelect - Handles item selection events and updates settings or triggers events.
 *  @method firstUpdated - Lifecycle method called after the component is first updated.
 *  @method disconnectedCallback - Lifecycle method called when the component is disconnected from the DOM.
 *  @method render - Renders the component's template.
 * 
 *  @event {{ item: MenuItem }} cx-select - Emitted when a menu item is selected.
            */
            interface CxTemplateSwitcherAttributes extends HTMLAttributes<CxTemplateSwitcher> {
              
        /**
          * 
        */
        data?: CxTemplateSwitcherTemplateSwitcherProps;
        /**
          * 
        */
        forcedSortOrder?: boolean;
        /**
          * 
        */
        forcedSortOrderReason?: string;
        /**
          * 
        */
        label?: string;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * 
            */
            interface CxTextToSpeechAttributes extends HTMLAttributes<CxTextToSpeech> {
              
        /**
          * 
        */
        data?: CxTextToSpeechTextToSpeechData;
        /**
          * 
        */
        editable?: boolean;
        /**
          * 
        */
        autofocus?: boolean;
        /**
          * 
        */
        componentTitle?: string;
        /**
          * 
        */
        maxHeight?: string;
        /**
          * 
        */
        minHeight?: string;
        /**
          * 
        */
        mock?: boolean;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            } 
            /**
              * @summary Video editor component.
 * 
 * 
 *  @dependency cx-space
 *  @dependency cx-video-editor-timeline
 *  @dependency cx-video-editor-toolbar
 *  @dependency cx-video-editor-tracks
 * 
 * 
 *  @event {{ time: number }} cx-time-update - Fired when the user seeks to a new time in the video.
 *  @event {{ action: VideoEditorToolbarActions }} cx-video-editor-action - Fired when a toolbar action is triggered.
 *  @event {{ recordIDs: string[] }} cx-video-editor-tracks-select - Fired when tracks are selected.
 *  @event {{ recordID: string }} cx-video-editor-tracks-transitions-select - Fired when a transition is selected.
            */
            interface CxVideoEditorAttributes extends HTMLAttributes<CxVideoEditor> {
              
        /**
          * 
        */
        data?: { subClips: CxVideoEditorPartial[]; transitions: CxVideoEditorTransition[]; };
        /**
          * 
        */
        ratios?: CxVideoEditorRatio[];
        /**
          * 
        */
        activeRatioLabel?: string;
        /**
          * 
        */
        canUndo?: boolean;
        /**
          * 
        */
        canRedo?: boolean;
        /**
          * 
        */
        canCancelAll?: boolean;
        /**
          * Indicates whether or not the export button should be shown.
        */
        showExport?: boolean;
        /**
          * 
        */
        scale?: number;
        /**
          * 
        */
        dirty?: boolean;
        /**
          * 
        */
        currentTime?: number;
        /**
          * Make localization attributes reactive
        */
        dir?: string;
        /**
          * 
        */
        lang?: string;
            }
              export type CxIconProps = DetailedHTMLProps<CxIconAttributes, CxIcon> & {class?: string};export type CxIconButtonProps = DetailedHTMLProps<CxIconButtonAttributes, CxIconButton> & {class?: string};export type CxAlertProps = DetailedHTMLProps<CxAlertAttributes, CxAlert> & {class?: string};export type CxAnimatedImageProps = DetailedHTMLProps<CxAnimatedImageAttributes, CxAnimatedImage> & {class?: string};export type CxAnimationProps = DetailedHTMLProps<CxAnimationAttributes, CxAnimation> & {class?: string};export type CxAvatarProps = DetailedHTMLProps<CxAvatarAttributes, CxAvatar> & {class?: string};export type CxBadgeProps = DetailedHTMLProps<CxBadgeAttributes, CxBadge> & {class?: string};export type CxBreadcrumbItemProps = DetailedHTMLProps<CxBreadcrumbItemAttributes, CxBreadcrumbItem> & {class?: string};export type CxBreadcrumbProps = DetailedHTMLProps<CxBreadcrumbAttributes, CxBreadcrumb> & {class?: string};export type CxPopupProps = DetailedHTMLProps<CxPopupAttributes, CxPopup> & {class?: string};export type CxSpinnerProps = DetailedHTMLProps<CxSpinnerAttributes, CxSpinner> & {class?: string};export type CxMenuItemProps = DetailedHTMLProps<CxMenuItemAttributes, CxMenuItem> & {class?: string};export type CxInputProps = DetailedHTMLProps<CxInputAttributes, CxInput> & {class?: string};export type CxMenuProps = DetailedHTMLProps<CxMenuAttributes, CxMenu> & {class?: string};export type CxTextareaProps = DetailedHTMLProps<CxTextareaAttributes, CxTextarea> & {class?: string};export type CxDropdownProps = DetailedHTMLProps<CxDropdownAttributes, CxDropdown> & {class?: string};export type CxButtonProps = DetailedHTMLProps<CxButtonAttributes, CxButton> & {class?: string};export type CxButtonGroupProps = DetailedHTMLProps<CxButtonGroupAttributes, CxButtonGroup> & {class?: string};export type CxCardProps = DetailedHTMLProps<CxCardAttributes, CxCard> & {class?: string};export type CxCarouselItemProps = DetailedHTMLProps<CxCarouselItemAttributes, CxCarouselItem> & {class?: string};export type CxCarouselProps = DetailedHTMLProps<CxCarouselAttributes, CxCarousel> & {class?: string};export type CxCheckboxProps = DetailedHTMLProps<CxCheckboxAttributes, CxCheckbox> & {class?: string};export type CxDividerProps = DetailedHTMLProps<CxDividerAttributes, CxDivider> & {class?: string};export type CxMarkdownProps = DetailedHTMLProps<CxMarkdownAttributes, CxMarkdown> & {class?: string};export type CxTooltipProps = DetailedHTMLProps<CxTooltipAttributes, CxTooltip> & {class?: string};export type CxTypographyProps = DetailedHTMLProps<CxTypographyAttributes, CxTypography> & {class?: string};export type CxChatbotProps = DetailedHTMLProps<CxChatbotAttributes, CxChatbot> & {class?: string};export type CxVisuallyHiddenProps = DetailedHTMLProps<CxVisuallyHiddenAttributes, CxVisuallyHidden> & {class?: string};export type CxColorPickerProps = DetailedHTMLProps<CxColorPickerAttributes, CxColorPicker> & {class?: string};export type CxCopyButtonProps = DetailedHTMLProps<CxCopyButtonAttributes, CxCopyButton> & {class?: string};export type CxDetailsProps = DetailedHTMLProps<CxDetailsAttributes, CxDetails> & {class?: string};export type CxDialogProps = DetailedHTMLProps<CxDialogAttributes, CxDialog> & {class?: string};export type CxDrawerProps = DetailedHTMLProps<CxDrawerAttributes, CxDrawer> & {class?: string};export type CxElementClampProps = DetailedHTMLProps<CxElementClampAttributes, CxElementClamp> & {class?: string};export type CxResizeObserverProps = DetailedHTMLProps<CxResizeObserverAttributes, CxResizeObserver> & {class?: string};export type CxLineClampProps = DetailedHTMLProps<CxLineClampAttributes, CxLineClamp> & {class?: string};export type CxTreeItemProps = DetailedHTMLProps<CxTreeItemAttributes, CxTreeItem> & {class?: string};export type CxTreeProps = DetailedHTMLProps<CxTreeAttributes, CxTree> & {class?: string};export type CxFormatBytesProps = DetailedHTMLProps<CxFormatBytesAttributes, CxFormatBytes> & {class?: string};export type CxOptionProps = DetailedHTMLProps<CxOptionAttributes, CxOption> & {class?: string};export type CxProgressBarProps = DetailedHTMLProps<CxProgressBarAttributes, CxProgressBar> & {class?: string};export type CxRelativeTimeProps = DetailedHTMLProps<CxRelativeTimeAttributes, CxRelativeTime> & {class?: string};export type CxTagProps = DetailedHTMLProps<CxTagAttributes, CxTag> & {class?: string};export type CxSelectProps = DetailedHTMLProps<CxSelectAttributes, CxSelect> & {class?: string};export type CxSpaceProps = DetailedHTMLProps<CxSpaceAttributes, CxSpace> & {class?: string};export type CxTabProps = DetailedHTMLProps<CxTabAttributes, CxTab> & {class?: string};export type CxTabPanelProps = DetailedHTMLProps<CxTabPanelAttributes, CxTabPanel> & {class?: string};export type CxTabGroupProps = DetailedHTMLProps<CxTabGroupAttributes, CxTabGroup> & {class?: string};export type CxConfirmPopoverProps = DetailedHTMLProps<CxConfirmPopoverAttributes, CxConfirmPopover> & {class?: string};export type CxFileOnDemandProps = DetailedHTMLProps<CxFileOnDemandAttributes, CxFileOnDemand> & {class?: string};export type CxFormatDateProps = DetailedHTMLProps<CxFormatDateAttributes, CxFormatDate> & {class?: string};export type CxFormatNumberProps = DetailedHTMLProps<CxFormatNumberAttributes, CxFormatNumber> & {class?: string};export type CxGridProps = DetailedHTMLProps<CxGridAttributes, CxGrid> & {class?: string};export type CxGridItemProps = DetailedHTMLProps<CxGridItemAttributes, CxGridItem> & {class?: string};export type CxHeaderProps = DetailedHTMLProps<CxHeaderAttributes, CxHeader> & {class?: string};export type CxHubConnectionProps = DetailedHTMLProps<CxHubConnectionAttributes, CxHubConnection> & {class?: string};export type CxImageComparerProps = DetailedHTMLProps<CxImageComparerAttributes, CxImageComparer> & {class?: string};export type CxSkeletonProps = DetailedHTMLProps<CxSkeletonAttributes, CxSkeleton> & {class?: string};export type CxImageProps = DetailedHTMLProps<CxImageAttributes, CxImage> & {class?: string};export type CxIncludeProps = DetailedHTMLProps<CxIncludeAttributes, CxInclude> & {class?: string};export type CxInputGroupProps = DetailedHTMLProps<CxInputGroupAttributes, CxInputGroup> & {class?: string};export type CxMasonryProps = DetailedHTMLProps<CxMasonryAttributes, CxMasonry> & {class?: string};export type CxMenuLabelProps = DetailedHTMLProps<CxMenuLabelAttributes, CxMenuLabel> & {class?: string};export type CxMenuSectionProps = DetailedHTMLProps<CxMenuSectionAttributes, CxMenuSection> & {class?: string};export type CxMutationObserverProps = DetailedHTMLProps<CxMutationObserverAttributes, CxMutationObserver> & {class?: string};export type CxPaginationProps = DetailedHTMLProps<CxPaginationAttributes, CxPagination> & {class?: string};export type CxProgressRingProps = DetailedHTMLProps<CxProgressRingAttributes, CxProgressRing> & {class?: string};export type CxQrCodeProps = DetailedHTMLProps<CxQrCodeAttributes, CxQrCode> & {class?: string};export type CxRadioProps = DetailedHTMLProps<CxRadioAttributes, CxRadio> & {class?: string};export type CxRadioButtonProps = DetailedHTMLProps<CxRadioButtonAttributes, CxRadioButton> & {class?: string};export type CxRadioCardProps = DetailedHTMLProps<CxRadioCardAttributes, CxRadioCard> & {class?: string};export type CxRadioGroupProps = DetailedHTMLProps<CxRadioGroupAttributes, CxRadioGroup> & {class?: string};export type CxRangeProps = DetailedHTMLProps<CxRangeAttributes, CxRange> & {class?: string};export type CxRatingProps = DetailedHTMLProps<CxRatingAttributes, CxRating> & {class?: string};export type CxSplitPanelProps = DetailedHTMLProps<CxSplitPanelAttributes, CxSplitPanel> & {class?: string};export type CxStepProps = DetailedHTMLProps<CxStepAttributes, CxStep> & {class?: string};export type CxStepperProps = DetailedHTMLProps<CxStepperAttributes, CxStepper> & {class?: string};export type CxSwitchProps = DetailedHTMLProps<CxSwitchAttributes, CxSwitch> & {class?: string};export type CxVideoProps = DetailedHTMLProps<CxVideoAttributes, CxVideo> & {class?: string};export type CxSidebarLayoutProps = DetailedHTMLProps<CxSidebarLayoutAttributes, CxSidebarLayout> & {class?: string};export type CxBicolorPickerProps = DetailedHTMLProps<CxBicolorPickerAttributes, CxBicolorPicker> & {class?: string};export type CxBorderInputGroupProps = DetailedHTMLProps<CxBorderInputGroupAttributes, CxBorderInputGroup> & {class?: string};export type CxColorSwatchProps = DetailedHTMLProps<CxColorSwatchAttributes, CxColorSwatch> & {class?: string};export type CxCropperProps = DetailedHTMLProps<CxCropperAttributes, CxCropper> & {class?: string};export type CxFolderSelectProps = DetailedHTMLProps<CxFolderSelectAttributes, CxFolderSelect> & {class?: string};export type CxGraphViewProps = DetailedHTMLProps<CxGraphViewAttributes, CxGraphView> & {class?: string};export type CxPaddingInputGroupProps = DetailedHTMLProps<CxPaddingInputGroupAttributes, CxPaddingInputGroup> & {class?: string};export type CxShadowInputGroupProps = DetailedHTMLProps<CxShadowInputGroupAttributes, CxShadowInputGroup> & {class?: string};export type CxSidebarProps = DetailedHTMLProps<CxSidebarAttributes, CxSidebar> & {class?: string};export type CxStepperWizardProps = DetailedHTMLProps<CxStepperWizardAttributes, CxStepperWizard> & {class?: string};export type CxStorybookProps = DetailedHTMLProps<CxStorybookAttributes, CxStorybook> & {class?: string};export type CxAssetLinkFormatProps = DetailedHTMLProps<CxAssetLinkFormatAttributes, CxAssetLinkFormat> & {class?: string};export type CxClusterManagementProps = DetailedHTMLProps<CxClusterManagementAttributes, CxClusterManagement> & {class?: string};export type CxColorSwatchGroupProps = DetailedHTMLProps<CxColorSwatchGroupAttributes, CxColorSwatchGroup> & {class?: string};export type CxCommentProps = DetailedHTMLProps<CxCommentAttributes, CxComment> & {class?: string};export type CxRteCodeBlockToolbarProps = DetailedHTMLProps<CxRteCodeBlockToolbarAttributes, CxRteCodeBlockToolbar> & {class?: string};export type CxColumnProps = DetailedHTMLProps<CxColumnAttributes, CxColumn> & {class?: string};export type CxColumnGroupProps = DetailedHTMLProps<CxColumnGroupAttributes, CxColumnGroup> & {class?: string};export type CxTextProps = DetailedHTMLProps<CxTextAttributes, CxText> & {class?: string};export type CxContentBuilderProps = DetailedHTMLProps<CxContentBuilderAttributes, CxContentBuilder> & {class?: string};export type CxDownloaderProps = DetailedHTMLProps<CxDownloaderAttributes, CxDownloader> & {class?: string};export type CxMultiSelectProps = DetailedHTMLProps<CxMultiSelectAttributes, CxMultiSelect> & {class?: string};export type CxTemplateSwitcherProps = DetailedHTMLProps<CxTemplateSwitcherAttributes, CxTemplateSwitcher> & {class?: string};export type CxTextToSpeechProps = DetailedHTMLProps<CxTextToSpeechAttributes, CxTextToSpeech> & {class?: string};export type CxVideoEditorProps = DetailedHTMLProps<CxVideoEditorAttributes, CxVideoEditor> & {class?: string};
              declare global {
                namespace JSX {
                  interface IntrinsicElements {
                    ['cx-icon']: CxIconProps;['cx-icon-button']: CxIconButtonProps;['cx-alert']: CxAlertProps;['cx-animated-image']: CxAnimatedImageProps;['cx-animation']: CxAnimationProps;['cx-avatar']: CxAvatarProps;['cx-badge']: CxBadgeProps;['cx-breadcrumb-item']: CxBreadcrumbItemProps;['cx-breadcrumb']: CxBreadcrumbProps;['cx-popup']: CxPopupProps;['cx-spinner']: CxSpinnerProps;['cx-menu-item']: CxMenuItemProps;['cx-input']: CxInputProps;['cx-menu']: CxMenuProps;['cx-textarea']: CxTextareaProps;['cx-dropdown']: CxDropdownProps;['cx-button']: CxButtonProps;['cx-button-group']: CxButtonGroupProps;['cx-card']: CxCardProps;['cx-carousel-item']: CxCarouselItemProps;['cx-carousel']: CxCarouselProps;['cx-checkbox']: CxCheckboxProps;['cx-divider']: CxDividerProps;['cx-markdown']: CxMarkdownProps;['cx-tooltip']: CxTooltipProps;['cx-typography']: CxTypographyProps;['cx-chatbot']: CxChatbotProps;['cx-visually-hidden']: CxVisuallyHiddenProps;['cx-color-picker']: CxColorPickerProps;['cx-copy-button']: CxCopyButtonProps;['cx-details']: CxDetailsProps;['cx-dialog']: CxDialogProps;['cx-drawer']: CxDrawerProps;['cx-element-clamp']: CxElementClampProps;['cx-resize-observer']: CxResizeObserverProps;['cx-line-clamp']: CxLineClampProps;['cx-tree-item']: CxTreeItemProps;['cx-tree']: CxTreeProps;['cx-format-bytes']: CxFormatBytesProps;['cx-option']: CxOptionProps;['cx-progress-bar']: CxProgressBarProps;['cx-relative-time']: CxRelativeTimeProps;['cx-tag']: CxTagProps;['cx-select']: CxSelectProps;['cx-space']: CxSpaceProps;['cx-tab']: CxTabProps;['cx-tab-panel']: CxTabPanelProps;['cx-tab-group']: CxTabGroupProps;['cx-confirm-popover']: CxConfirmPopoverProps;['cx-file-on-demand']: CxFileOnDemandProps;['cx-format-date']: CxFormatDateProps;['cx-format-number']: CxFormatNumberProps;['cx-grid']: CxGridProps;['cx-grid-item']: CxGridItemProps;['cx-header']: CxHeaderProps;['cx-hub-connection']: CxHubConnectionProps;['cx-image-comparer']: CxImageComparerProps;['cx-skeleton']: CxSkeletonProps;['cx-image']: CxImageProps;['cx-include']: CxIncludeProps;['cx-input-group']: CxInputGroupProps;['cx-masonry']: CxMasonryProps;['cx-menu-label']: CxMenuLabelProps;['cx-menu-section']: CxMenuSectionProps;['cx-mutation-observer']: CxMutationObserverProps;['cx-pagination']: CxPaginationProps;['cx-progress-ring']: CxProgressRingProps;['cx-qr-code']: CxQrCodeProps;['cx-radio']: CxRadioProps;['cx-radio-button']: CxRadioButtonProps;['cx-radio-card']: CxRadioCardProps;['cx-radio-group']: CxRadioGroupProps;['cx-range']: CxRangeProps;['cx-rating']: CxRatingProps;['cx-split-panel']: CxSplitPanelProps;['cx-step']: CxStepProps;['cx-stepper']: CxStepperProps;['cx-switch']: CxSwitchProps;['cx-video']: CxVideoProps;['cx-sidebar-layout']: CxSidebarLayoutProps;['cx-bicolor-picker']: CxBicolorPickerProps;['cx-border-input-group']: CxBorderInputGroupProps;['cx-color-swatch']: CxColorSwatchProps;['cx-cropper']: CxCropperProps;['cx-folder-select']: CxFolderSelectProps;['cx-graph-view']: CxGraphViewProps;['cx-padding-input-group']: CxPaddingInputGroupProps;['cx-shadow-input-group']: CxShadowInputGroupProps;['cx-sidebar']: CxSidebarProps;['cx-stepper-wizard']: CxStepperWizardProps;['cx-storybook']: CxStorybookProps;['cx-asset-link-format']: CxAssetLinkFormatProps;['cx-cluster-management']: CxClusterManagementProps;['cx-color-swatch-group']: CxColorSwatchGroupProps;['cx-comment']: CxCommentProps;['cx-rte-code-block-toolbar']: CxRteCodeBlockToolbarProps;['cx-column']: CxColumnProps;['cx-column-group']: CxColumnGroupProps;['cx-text']: CxTextProps;['cx-content-builder']: CxContentBuilderProps;['cx-downloader']: CxDownloaderProps;['cx-multi-select']: CxMultiSelectProps;['cx-template-switcher']: CxTemplateSwitcherProps;['cx-text-to-speech']: CxTextToSpeechProps;['cx-video-editor']: CxVideoEditorProps;
                  }
                }
              }
            