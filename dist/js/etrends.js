/*!
 * fullPage 2.7.9
 * https://github.com/alvarotrigo/fullPage.js
 * @license MIT licensed
 *
 * Copyright (C) 2015 alvarotrigo.com - A project by Alvaro Trigo
 */
(function(global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
          return factory($, global, global.document, global.Math);
        });
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'), global, global.document, global.Math);
    } else {
        factory(jQuery, global, global.document, global.Math);
    }
})(typeof window !== 'undefined' ? window : this, function($, window, document, Math, undefined) {
    'use strict';

    // keeping central set of classnames and selectors
    var WRAPPER =               'fullpage-wrapper';
    var WRAPPER_SEL =           '.' + WRAPPER;

    // slimscroll
    var SCROLLABLE =            'fp-scrollable';
    var SCROLLABLE_SEL =        '.' + SCROLLABLE;
    var SLIMSCROLL_BAR_SEL =    '.slimScrollBar';
    var SLIMSCROLL_RAIL_SEL =   '.slimScrollRail';

    // util
    var RESPONSIVE =            'fp-responsive';
    var NO_TRANSITION =         'fp-notransition';
    var DESTROYED =             'fp-destroyed';
    var ENABLED =               'fp-enabled';
    var VIEWING_PREFIX =        'fp-viewing';
    var ACTIVE =                'active';
    var ACTIVE_SEL =            '.' + ACTIVE;
    var COMPLETELY =            'fp-completely';
    var COMPLETELY_SEL =        '.' + COMPLETELY;

    // section
    var SECTION_DEFAULT_SEL =   '.section';
    var SECTION =               'fp-section';
    var SECTION_SEL =           '.' + SECTION;
    var SECTION_ACTIVE_SEL =    SECTION_SEL + ACTIVE_SEL;
    var SECTION_FIRST_SEL =     SECTION_SEL + ':first';
    var SECTION_LAST_SEL =      SECTION_SEL + ':last';
    var TABLE_CELL =            'fp-tableCell';
    var TABLE_CELL_SEL =        '.' + TABLE_CELL;
    var AUTO_HEIGHT =           'fp-auto-height';
    var AUTO_HEIGHT_SEL =       '.fp-auto-height';
    var NORMAL_SCROLL =         'fp-normal-scroll';
    var NORMAL_SCROLL_SEL =     '.fp-normal-scroll';

    // section nav
    var SECTION_NAV =           'fp-nav';
    var SECTION_NAV_SEL =       '#' + SECTION_NAV;
    var SECTION_NAV_TOOLTIP =   'fp-tooltip';
    var SECTION_NAV_TOOLTIP_SEL='.'+SECTION_NAV_TOOLTIP;
    var SHOW_ACTIVE_TOOLTIP =   'fp-show-active';

    // slide
    var SLIDE_DEFAULT_SEL =     '.slide';
    var SLIDE =                 'fp-slide';
    var SLIDE_SEL =             '.' + SLIDE;
    var SLIDE_ACTIVE_SEL =      SLIDE_SEL + ACTIVE_SEL;
    var SLIDES_WRAPPER =        'fp-slides';
    var SLIDES_WRAPPER_SEL =    '.' + SLIDES_WRAPPER;
    var SLIDES_CONTAINER =      'fp-slidesContainer';
    var SLIDES_CONTAINER_SEL =  '.' + SLIDES_CONTAINER;
    var TABLE =                 'fp-table';

    // slide nav
    var SLIDES_NAV =            'fp-slidesNav';
    var SLIDES_NAV_SEL =        '.' + SLIDES_NAV;
    var SLIDES_NAV_LINK_SEL =   SLIDES_NAV_SEL + ' a';
    var SLIDES_ARROW =          'fp-controlArrow';
    var SLIDES_ARROW_SEL =      '.' + SLIDES_ARROW;
    var SLIDES_PREV =           'fp-prev';
    var SLIDES_PREV_SEL =       '.' + SLIDES_PREV;
    var SLIDES_ARROW_PREV =     SLIDES_ARROW + ' ' + SLIDES_PREV;
    var SLIDES_ARROW_PREV_SEL = SLIDES_ARROW_SEL + SLIDES_PREV_SEL;
    var SLIDES_NEXT =           'fp-next';
    var SLIDES_NEXT_SEL =       '.' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT =     SLIDES_ARROW + ' ' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT_SEL = SLIDES_ARROW_SEL + SLIDES_NEXT_SEL;

    var $window = $(window);
    var $document = $(document);

    var defaultScrollHandler;

    $.fn.fullpage = function(options) {
        //only once my friend!
        if($('html').hasClass(ENABLED)){ displayWarnings(); return };

        // common jQuery objects
        var $htmlBody = $('html, body');
        var $body = $('body');

        var FP = $.fn.fullpage;
        // Create some defaults, extending them with any options that were provided
        options = $.extend({
            //navigation
            menu: false,
            anchors:[],
            lockAnchors: false,
            navigation: false,
            navigationPosition: 'right',
            navigationTooltips: [],
            showActiveTooltip: false,
            slidesNavigation: false,
            slidesNavPosition: 'bottom',
            scrollBar: false,
            hybrid: false,

            //scrolling
            css3: true,
            scrollingSpeed: 700,
            autoScrolling: true,
            fitToSection: true,
            fitToSectionDelay: 1000,
            easing: 'easeInOutCubic',
            easingcss3: 'ease',
            loopBottom: false,
            loopTop: false,
            loopHorizontal: true,
            continuousVertical: false,
            normalScrollElements: null,
            scrollOverflow: false,
            scrollOverflowHandler: defaultScrollHandler,
            touchSensitivity: 5,
            normalScrollElementTouchThreshold: 5,

            //Accessibility
            keyboardScrolling: true,
            animateAnchor: true,
            recordHistory: true,

            //design
            controlArrows: true,
            controlArrowColor: '#fff',
            verticalCentered: true,
            resize: false,
            sectionsColor : [],
            paddingTop: 0,
            paddingBottom: 0,
            fixedElements: null,
            responsive: 0, //backwards compabitility with responsiveWiddth
            responsiveWidth: 0,
            responsiveHeight: 0,

            //Custom selectors
            sectionSelector: SECTION_DEFAULT_SEL,
            slideSelector: SLIDE_DEFAULT_SEL,


            //events
            afterLoad: null,
            onLeave: null,
            afterRender: null,
            afterResize: null,
            afterReBuild: null,
            afterSlideLoad: null,
            onSlideLeave: null
        }, options);

        displayWarnings();

        //easeInOutCubic animation included in the plugin
        $.extend($.easing,{ easeInOutCubic: function (x, t, b, c, d) {if ((t/=d/2) < 1) return c/2*t*t*t + b;return c/2*((t-=2)*t*t + 2) + b;}});

        /**
        * Sets the autoScroll option.
        * It changes the scroll bar visibility and the history of the site as a result.
        */
        FP.setAutoScrolling = function(value, type){
            setVariableState('autoScrolling', value, type);

            var element = $(SECTION_ACTIVE_SEL);

            if(options.autoScrolling && !options.scrollBar){
                $htmlBody.css({
                    'overflow' : 'hidden',
                    'height' : '100%'
                });

                FP.setRecordHistory(originals.recordHistory, 'internal');

                //for IE touch devices
                container.css({
                    '-ms-touch-action': 'none',
                    'touch-action': 'none'
                });

                if(element.length){
                    //moving the container up
                    silentScroll(element.position().top);
                }

            }else{
                $htmlBody.css({
                    'overflow' : 'visible',
                    'height' : 'initial'
                });

                FP.setRecordHistory(false, 'internal');

                //for IE touch devices
                container.css({
                    '-ms-touch-action': '',
                    'touch-action': ''
                });

                silentScroll(0);

                //scrolling the page to the section with no animation
                if (element.length) {
                    $htmlBody.scrollTop(element.position().top);
                }
            }
        };

        /**
        * Defines wheter to record the history for each hash change in the URL.
        */
        FP.setRecordHistory = function(value, type){
            setVariableState('recordHistory', value, type);
        };

        /**
        * Defines the scrolling speed
        */
        FP.setScrollingSpeed = function(value, type){
            setVariableState('scrollingSpeed', value, type);
        };

        /**
        * Sets fitToSection
        */
        FP.setFitToSection = function(value, type){
            setVariableState('fitToSection', value, type);
        };

        /**
        * Sets lockAnchors
        */
        FP.setLockAnchors = function(value){
            options.lockAnchors = value;
        };

        /**
        * Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
        */
        FP.setMouseWheelScrolling = function (value){
            if(value){
                addMouseWheelHandler();
                addMiddleWheelHandler();
            }else{
                removeMouseWheelHandler();
                removeMiddleWheelHandler();
            }
        };

        /**
        * Adds or remove the possiblity of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
        * Optionally a second parameter can be used to specify the direction for which the action will be applied.
        *
        * @param directions string containing the direction or directions separated by comma.
        */
        FP.setAllowScrolling = function (value, directions){
            if(typeof directions !== 'undefined'){
                directions = directions.replace(/ /g,'').split(',');

                $.each(directions, function (index, direction){
                    setIsScrollAllowed(value, direction, 'm');
                });
            }
            else if(value){
                FP.setMouseWheelScrolling(true);
                addTouchHandler();
            }else{
                FP.setMouseWheelScrolling(false);
                removeTouchHandler();
            }
        };

        /**
        * Adds or remove the possiblity of scrolling through sections by using the keyboard arrow keys
        */
        FP.setKeyboardScrolling = function (value, directions){
            if(typeof directions !== 'undefined'){
                directions = directions.replace(/ /g,'').split(',');

                $.each(directions, function (index, direction){
                    setIsScrollAllowed(value, direction, 'k');
                });
            }else{
                options.keyboardScrolling = value;
            }
        };

        /**
        * Moves the page up one section.
        */
        FP.moveSectionUp = function(){
            var prev = $(SECTION_ACTIVE_SEL).prev(SECTION_SEL);

            //looping to the bottom if there's no more sections above
            if (!prev.length && (options.loopTop || options.continuousVertical)) {
                prev = $(SECTION_SEL).last();
            }

            if (prev.length) {
                scrollPage(prev, null, true);
            }
        };

        /**
        * Moves the page down one section.
        */
        FP.moveSectionDown = function (){
            var next = $(SECTION_ACTIVE_SEL).next(SECTION_SEL);

            //looping to the top if there's no more sections below
            if(!next.length &&
                (options.loopBottom || options.continuousVertical)){
                next = $(SECTION_SEL).first();
            }

            if(next.length){
                scrollPage(next, null, false);
            }
        };

        /**
        * Moves the page to the given section and slide with no animation.
        * Anchors or index positions can be used as params.
        */
        FP.silentMoveTo = function(sectionAnchor, slideAnchor){
            FP.setScrollingSpeed (0, 'internal');
            FP.moveTo(sectionAnchor, slideAnchor)
            FP.setScrollingSpeed (originals.scrollingSpeed, 'internal');
        };

        /**
        * Moves the page to the given section and slide.
        * Anchors or index positions can be used as params.
        */
        FP.moveTo = function (sectionAnchor, slideAnchor){
            var destiny = getSectionByAnchor(sectionAnchor);

            if (typeof slideAnchor !== 'undefined'){
                scrollPageAndSlide(sectionAnchor, slideAnchor);
            }else if(destiny.length > 0){
                scrollPage(destiny);
            }
        };

        /**
        * Slides right the slider of the active section.
        * Optional `section` param.
        */
        FP.moveSlideRight = function(section){
            moveSlide('next', section);
        };

        /**
        * Slides left the slider of the active section.
        * Optional `section` param.
        */
        FP.moveSlideLeft = function(section){
            moveSlide('prev', section);
        };

        /**
         * When resizing is finished, we adjust the slides sizes and positions
         */
        FP.reBuild = function(resizing){
            if(container.hasClass(DESTROYED)){ return; }  //nothing to do if the plugin was destroyed

            isResizing = true;

            var windowsWidth = $window.outerWidth();
            windowsHeight = $window.height();  //updating global var

            //text resizing
            if (options.resize) {
                resizeMe(windowsHeight, windowsWidth);
            }

            $(SECTION_SEL).each(function(){
                var slidesWrap = $(this).find(SLIDES_WRAPPER_SEL);
                var slides = $(this).find(SLIDE_SEL);

                //adjusting the height of the table-cell for IE and Firefox
                if(options.verticalCentered){
                    $(this).find(TABLE_CELL_SEL).css('height', getTableHeight($(this)) + 'px');
                }

                $(this).css('height', windowsHeight + 'px');

                //resizing the scrolling divs
                if(options.scrollOverflow){
                    if(slides.length){
                        slides.each(function(){
                            createSlimScrolling($(this));
                        });
                    }else{
                        createSlimScrolling($(this));
                    }
                }

                //adjusting the position fo the FULL WIDTH slides...
                if (slides.length > 1) {
                    landscapeScroll(slidesWrap, slidesWrap.find(SLIDE_ACTIVE_SEL));
                }
            });

            var activeSection = $(SECTION_ACTIVE_SEL);
            var sectionIndex = activeSection.index(SECTION_SEL);

            //isn't it the first section?
            if(sectionIndex){
                //adjusting the position for the current section
                FP.silentMoveTo(sectionIndex + 1);
            }

            isResizing = false;
            $.isFunction( options.afterResize ) && resizing && options.afterResize.call(container);
            $.isFunction( options.afterReBuild ) && !resizing && options.afterReBuild.call(container);
        };

        /**
        * Turns fullPage.js to normal scrolling mode when the viewport `width` or `height`
        * are smaller than the set limit values.
        */
        FP.setResponsive = function (active){
            var isResponsive = $body.hasClass(RESPONSIVE);

            if(active){
                if(!isResponsive){
                    FP.setAutoScrolling(false, 'internal');
                    FP.setFitToSection(false, 'internal');
                    $(SECTION_NAV_SEL).hide();
                    $body.addClass(RESPONSIVE);
                }
            }
            else if(isResponsive){
                FP.setAutoScrolling(originals.autoScrolling, 'internal');
                FP.setFitToSection(originals.autoScrolling, 'internal');
                $(SECTION_NAV_SEL).show();
                $body.removeClass(RESPONSIVE);
            }
        }

        //flag to avoid very fast sliding for landscape sliders
        var slideMoving = false;

        var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/);
        var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
        var container = $(this);
        var windowsHeight = $window.height();
        var isResizing = false;
        var isWindowFocused = true;
        var lastScrolledDestiny;
        var lastScrolledSlide;
        var canScroll = true;
        var scrollings = [];
        var nav;
        var controlPressed;
        var isScrollAllowed = {};
        isScrollAllowed.m = {  'up':true, 'down':true, 'left':true, 'right':true };
        isScrollAllowed.k = $.extend(true,{}, isScrollAllowed.m);
        var originals = $.extend(true, {}, options); //deep copy

        //timeouts
        var resizeId;
        var afterSectionLoadsId;
        var afterSlideLoadsId;
        var scrollId;
        var scrollId2;
        var keydownId;

        if($(this).length){
            init();
            bindEvents();
        }

        function init(){
            //if css3 is not supported, it will use jQuery animations
            if(options.css3){
                options.css3 = support3d();
            }

            options.scrollBar = options.scrollBar || options.hybrid;


            setOptionsFromDOM();

            prepareDom();
            FP.setAllowScrolling(true);

            FP.setAutoScrolling(options.autoScrolling, 'internal');

            //the starting point is a slide?
            var activeSlide = $(SECTION_ACTIVE_SEL).find(SLIDE_ACTIVE_SEL);

            //the active section isn't the first one? Is not the first slide of the first section? Then we load that section/slide by default.
            if( activeSlide.length &&  ($(SECTION_ACTIVE_SEL).index(SECTION_SEL) !== 0 || ($(SECTION_ACTIVE_SEL).index(SECTION_SEL) === 0 && activeSlide.index() !== 0))){
                silentLandscapeScroll(activeSlide);
            }

            responsive();

            //setting the class for the body element
            setBodyClass();

            $window.on('load', function() {
                scrollToAnchor();
            });
        }

        function bindEvents(){
            $window
                //when scrolling...
                .on('scroll', scrollHandler)

                //detecting any change on the URL to scroll to the given anchor link
                //(a way to detect back history button as we play with the hashes on the URL)
                .on('hashchange', hashChangeHandler)

                //when opening a new tab (ctrl + t), `control` won't be pressed when comming back.
                .blur(blurHandler)

                //when resizing the site, we adjust the heights of the sections, slimScroll...
                .resize(resizeHandler);

            $document
                //Sliding with arrow keys, both, vertical and horizontal
                .keydown(keydownHandler)

                //to prevent scrolling while zooming
                .keyup(keyUpHandler)

                //Scrolls to the section when clicking the navigation bullet
                .on('click touchstart', SECTION_NAV_SEL + ' a', sectionBulletHandler)

                //Scrolls the slider to the given slide destination for the given section
                .on('click touchstart', SLIDES_NAV_LINK_SEL, slideBulletHandler)

                .on('click', SECTION_NAV_TOOLTIP_SEL, tooltipTextHandler);

            //Scrolling horizontally when clicking on the slider controls.
            $(SECTION_SEL).on('click touchstart', SLIDES_ARROW_SEL, slideArrowHandler);

            /**
            * Applying normalScroll elements.
            * Ignoring the scrolls over the specified selectors.
            */
            if(options.normalScrollElements){
                $document.on('mouseenter', options.normalScrollElements, function () {
                    FP.setMouseWheelScrolling(false);
                });

                $document.on('mouseleave', options.normalScrollElements, function(){
                    FP.setMouseWheelScrolling(true);
                });
            }
        }

        /**
        * Setting options from DOM elements if they are not provided.
        */
        function setOptionsFromDOM(){
            //no anchors option? Checking for them in the DOM attributes
            if(!options.anchors.length){
                options.anchors = $(options.sectionSelector + '[data-anchor]').map(function(){
                    return $(this).data('anchor').toString();
                }).get();
            }

            //no tooltipos option? Checking for them in the DOM attributes
            if(!options.navigationTooltips.length){
                options.navigationTooltips = $(options.sectionSelector + '[data-tooltip]').map(function(){
                    return $(this).data('tooltip').toString();
                }).get();
            }
        }

        /**
        * Works over the DOM structure to set it up for the current fullpage optionss.
        */
        function prepareDom(){
            container.css({
                'height': '100%',
                'position': 'relative'
            });

            //adding a class to recognize the container internally in the code
            container.addClass(WRAPPER);
            $('html').addClass(ENABLED);

            //due to https://github.com/alvarotrigo/fullPage.js/issues/1502
            windowsHeight = $window.height();

            container.removeClass(DESTROYED); //in case it was destroyed before initilizing it again

            addInternalSelectors();

             //styling the sections / slides / menu
            $(SECTION_SEL).each(function(index){
                var section = $(this);
                var slides = section.find(SLIDE_SEL);
                var numSlides = slides.length;

                styleSection(section, index);
                styleMenu(section, index);

                // if there's any slide
                if (numSlides > 0) {
                    styleSlides(section, slides, numSlides);
                }else{
                    if(options.verticalCentered){
                        addTableClass(section);
                    }
                }
            });

            //fixed elements need to be moved out of the plugin container due to problems with CSS3.
            if(options.fixedElements && options.css3){
                $(options.fixedElements).appendTo($body);
            }

            //vertical centered of the navigation + active bullet
            if(options.navigation){
                addVerticalNavigation();
            }

            if(options.scrollOverflow){
                if(document.readyState === 'complete'){
                    createSlimScrollingHandler();
                }
                //after DOM and images are loaded
                $window.on('load', createSlimScrollingHandler);
            }else{
                afterRenderActions();
            }
        }

        /**
        * Styles the horizontal slides for a section.
        */
        function styleSlides(section, slides, numSlides){
            var sliderWidth = numSlides * 100;
            var slideWidth = 100 / numSlides;

            slides.wrapAll('<div class="' + SLIDES_CONTAINER + '" />');
            slides.parent().wrap('<div class="' + SLIDES_WRAPPER + '" />');

            section.find(SLIDES_CONTAINER_SEL).css('width', sliderWidth + '%');

            if(numSlides > 1){
                if(options.controlArrows){
                    createSlideArrows(section);
                }

                if(options.slidesNavigation){
                    addSlidesNavigation(section, numSlides);
                }
            }

            slides.each(function(index) {
                $(this).css('width', slideWidth + '%');

                if(options.verticalCentered){
                    addTableClass($(this));
                }
            });

            var startingSlide = section.find(SLIDE_ACTIVE_SEL);

            //if the slide won't be an starting point, the default will be the first one
            //the active section isn't the first one? Is not the first slide of the first section? Then we load that section/slide by default.
            if( startingSlide.length &&  ($(SECTION_ACTIVE_SEL).index(SECTION_SEL) !== 0 || ($(SECTION_ACTIVE_SEL).index(SECTION_SEL) === 0 && startingSlide.index() !== 0))){
                silentLandscapeScroll(startingSlide);
            }else{
                slides.eq(0).addClass(ACTIVE);
            }
        }

        /**
        * Styling vertical sections
        */
        function styleSection(section, index){
            //if no active section is defined, the 1st one will be the default one
            if(!index && $(SECTION_ACTIVE_SEL).length === 0) {
                section.addClass(ACTIVE);
            }

            section.css('height', windowsHeight + 'px');

            if(options.paddingTop){
                section.css('padding-top', options.paddingTop);
            }

            if(options.paddingBottom){
                section.css('padding-bottom', options.paddingBottom);
            }

            if (typeof options.sectionsColor[index] !==  'undefined') {
                section.css('background-color', options.sectionsColor[index]);
            }

            if (typeof options.anchors[index] !== 'undefined') {
                section.attr('data-anchor', options.anchors[index]);
            }
        }

        /**
        * Sets the data-anchor attributes to the menu elements and activates the current one.
        */
        function styleMenu(section, index){
            if (typeof options.anchors[index] !== 'undefined') {
                //activating the menu / nav element on load
                if(section.hasClass(ACTIVE)){
                    activateMenuAndNav(options.anchors[index], index);
                }
            }

            //moving the menu outside the main container if it is inside (avoid problems with fixed positions when using CSS3 tranforms)
            if(options.menu && options.css3 && $(options.menu).closest(WRAPPER_SEL).length){
                $(options.menu).appendTo($body);
            }
        }

        /**
        * Adds internal classes to be able to provide customizable selectors
        * keeping the link with the style sheet.
        */
        function addInternalSelectors(){
            //adding internal class names to void problem with common ones
            $(options.sectionSelector).each(function(){
                $(this).addClass(SECTION);
            });
            $(options.slideSelector).each(function(){
                $(this).addClass(SLIDE);
            });
        }

        /**
        * Creates the control arrows for the given section
        */
        function createSlideArrows(section){
            section.find(SLIDES_WRAPPER_SEL).after('<div class="' + SLIDES_ARROW_PREV + '"></div><div class="' + SLIDES_ARROW_NEXT + '"></div>');

            if(options.controlArrowColor!='#fff'){
                section.find(SLIDES_ARROW_NEXT_SEL).css('border-color', 'transparent transparent transparent '+options.controlArrowColor);
                section.find(SLIDES_ARROW_PREV_SEL).css('border-color', 'transparent '+ options.controlArrowColor + ' transparent transparent');
            }

            if(!options.loopHorizontal){
                section.find(SLIDES_ARROW_PREV_SEL).hide();
            }
        }

        /**
        * Creates a vertical navigation bar.
        */
        function addVerticalNavigation(){
            $body.append('<div id="' + SECTION_NAV + '"><ul></ul></div>');
            var nav = $(SECTION_NAV_SEL);

            nav.addClass(function() {
                return options.showActiveTooltip ? SHOW_ACTIVE_TOOLTIP + ' ' + options.navigationPosition : options.navigationPosition;
            });

            for (var i = 0; i < $(SECTION_SEL).length; i++) {
                var link = '';
                if (options.anchors.length) {
                    link = options.anchors[i];
                }

                var li = '<li><a href="#' + link + '"><span></span></a>';

                // Only add tooltip if needed (defined by user)
                var tooltip = options.navigationTooltips[i];

                if (typeof tooltip !== 'undefined' && tooltip !== '') {
                    li += '<div class="' + SECTION_NAV_TOOLTIP + ' ' + options.navigationPosition + '">' + tooltip + '</div>';
                }

                li += '</li>';

                nav.find('ul').append(li);
            }

            //centering it vertically
            $(SECTION_NAV_SEL).css('margin-top', '-' + ($(SECTION_NAV_SEL).height()/2) + 'px');

            //activating the current active section
            $(SECTION_NAV_SEL).find('li').eq($(SECTION_ACTIVE_SEL).index(SECTION_SEL)).find('a').addClass(ACTIVE);
        }

        /**
        * Creates the slim scroll scrollbar for the sections and slides inside them.
        */
        function createSlimScrollingHandler(){
            $(SECTION_SEL).each(function(){
                var slides = $(this).find(SLIDE_SEL);

                if(slides.length){
                    slides.each(function(){
                        createSlimScrolling($(this));
                    });
                }else{
                    createSlimScrolling($(this));
                }

            });
            afterRenderActions();
        }

        /**
        * Actions and callbacks to fire afterRender
        */
        function afterRenderActions(){
            var section = $(SECTION_ACTIVE_SEL);

            section.addClass(COMPLETELY);

            if(options.scrollOverflowHandler.afterRender){
                options.scrollOverflowHandler.afterRender(section);
            }
            lazyLoad(section);
            playMedia(section);

            $.isFunction( options.afterLoad ) && options.afterLoad.call(section, section.data('anchor'), (section.index(SECTION_SEL) + 1));
            $.isFunction( options.afterRender ) && options.afterRender.call(container);
        }


        var isScrolling = false;
        var lastScroll = 0;

        //when scrolling...
        function scrollHandler(){
            var currentSection;

            if(!options.autoScrolling || options.scrollBar){
                var currentScroll = $window.scrollTop();
                var scrollDirection = getScrollDirection(currentScroll);
                var visibleSectionIndex = 0;
                var screen_mid = currentScroll + ($window.height() / 2.0);

                //taking the section which is showing more content in the viewport
                var sections =  document.querySelectorAll(SECTION_SEL);
                for (var i = 0; i < sections.length; ++i) {
                    var section = sections[i];

                    // Pick the the last section which passes the middle line of the screen.
                    if (section.offsetTop <= screen_mid)
                    {
                        visibleSectionIndex = i;
                    }
                }

                if(isCompletelyInViewPort(scrollDirection)){
                    if(!$(SECTION_ACTIVE_SEL).hasClass(COMPLETELY)){
                        $(SECTION_ACTIVE_SEL).addClass(COMPLETELY).siblings().removeClass(COMPLETELY);
                    }
                }

                //geting the last one, the current one on the screen
                currentSection = $(sections).eq(visibleSectionIndex);

                //setting the visible section as active when manually scrolling
                //executing only once the first time we reach the section
                if(!currentSection.hasClass(ACTIVE)){
                    isScrolling = true;
                    var leavingSection = $(SECTION_ACTIVE_SEL);
                    var leavingSectionIndex = leavingSection.index(SECTION_SEL) + 1;
                    var yMovement = getYmovement(currentSection);
                    var anchorLink  = currentSection.data('anchor');
                    var sectionIndex = currentSection.index(SECTION_SEL) + 1;
                    var activeSlide = currentSection.find(SLIDE_ACTIVE_SEL);

                    if(activeSlide.length){
                        var slideAnchorLink = activeSlide.data('anchor');
                        var slideIndex = activeSlide.index();
                    }

                    if(canScroll){
                        currentSection.addClass(ACTIVE).siblings().removeClass(ACTIVE);

                        $.isFunction( options.onLeave ) && options.onLeave.call( leavingSection, leavingSectionIndex, sectionIndex, yMovement);

                        $.isFunction( options.afterLoad ) && options.afterLoad.call( currentSection, anchorLink, sectionIndex);
                        lazyLoad(currentSection);

                        activateMenuAndNav(anchorLink, sectionIndex - 1);

                        if(options.anchors.length){
                            //needed to enter in hashChange event when using the menu with anchor links
                            lastScrolledDestiny = anchorLink;

                            setState(slideIndex, slideAnchorLink, anchorLink, sectionIndex);
                        }
                    }

                    //small timeout in order to avoid entering in hashChange event when scrolling is not finished yet
                    clearTimeout(scrollId);
                    scrollId = setTimeout(function(){
                        isScrolling = false;
                    }, 100);
                }

                if(options.fitToSection){
                    //for the auto adjust of the viewport to fit a whole section
                    clearTimeout(scrollId2);

                    scrollId2 = setTimeout(function(){
                        //checking fitToSection again in case it was set to false before the timeout delay
                        if(canScroll && options.fitToSection){
                            //allows to scroll to an active section and
                            //if the section is already active, we prevent firing callbacks
                            if($(SECTION_ACTIVE_SEL).is(currentSection)){
                                isResizing = true;
                            }
                            scrollPage($(SECTION_ACTIVE_SEL));

                            isResizing = false;
                        }
                    }, options.fitToSectionDelay);
                }
            }
        }

        /**
        * Determines whether the active section has seen in its whole or not.
        */
        function isCompletelyInViewPort(movement){
            var top = $(SECTION_ACTIVE_SEL).position().top;
            var bottom = top + $window.height();

            if(movement == 'up'){
                return bottom >= ($window.scrollTop() + $window.height());
            }
            return top <= $window.scrollTop();
        }

        /**
        * Gets the directon of the the scrolling fired by the scroll event.
        */
        function getScrollDirection(currentScroll){
            var direction = currentScroll > lastScroll ? 'down' : 'up';

            lastScroll = currentScroll;

            return direction;
        }

        /**
        * Determines the way of scrolling up or down:
        * by 'automatically' scrolling a section or by using the default and normal scrolling.
        */
        function scrolling(type, scrollable){
            if (!isScrollAllowed.m[type]){
                return;
            }
            var check, scrollSection;

            if(type == 'down'){
                check = 'bottom';
                scrollSection = FP.moveSectionDown;
            }else{
                check = 'top';
                scrollSection = FP.moveSectionUp;
            }

            if(scrollable.length > 0 ){
                //is the scrollbar at the start/end of the scroll?
                if(options.scrollOverflowHandler.isScrolled(check, scrollable)){
                    scrollSection();
                }else{
                    return true;
                }
            }else{
                // moved up/down
                scrollSection();
            }
        }


        var touchStartY = 0;
        var touchStartX = 0;
        var touchEndY = 0;
        var touchEndX = 0;

        /* Detecting touch events

        * As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
        * This way, the touchstart and the touch moves shows an small difference between them which is the
        * used one to determine the direction.
        */
        function touchMoveHandler(event){
            var e = event.originalEvent;

            // additional: if one of the normalScrollElements isn't within options.normalScrollElementTouchThreshold hops up the DOM chain
            if (!checkParentForNormalScrollElement(event.target) && isReallyTouch(e) ) {

                if(options.autoScrolling){
                    //preventing the easing on iOS devices
                    event.preventDefault();
                }

                var activeSection = $(SECTION_ACTIVE_SEL);
                var scrollable = options.scrollOverflowHandler.scrollable(activeSection);

                if (canScroll && !slideMoving) { //if theres any #
                    var touchEvents = getEventsPage(e);

                    touchEndY = touchEvents.y;
                    touchEndX = touchEvents.x;

                    //if movement in the X axys is greater than in the Y and the currect section has slides...
                    if (activeSection.find(SLIDES_WRAPPER_SEL).length && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))) {

                        //is the movement greater than the minimum resistance to scroll?
                        if (Math.abs(touchStartX - touchEndX) > ($window.outerWidth() / 100 * options.touchSensitivity)) {
                            if (touchStartX > touchEndX) {
                                if(isScrollAllowed.m.right){
                                    FP.moveSlideRight(); //next
                                }
                            } else {
                                if(isScrollAllowed.m.left){
                                    FP.moveSlideLeft(); //prev
                                }
                            }
                        }
                    }

                    //vertical scrolling (only when autoScrolling is enabled)
                    else if(options.autoScrolling){

                        //is the movement greater than the minimum resistance to scroll?
                        if (Math.abs(touchStartY - touchEndY) > ($window.height() / 100 * options.touchSensitivity)) {
                            if (touchStartY > touchEndY) {
                                scrolling('down', scrollable);
                            } else if (touchEndY > touchStartY) {
                                scrolling('up', scrollable);
                            }
                        }
                    }
                }
            }

        }

        /**
         * recursive function to loop up the parent nodes to check if one of them exists in options.normalScrollElements
         * Currently works well for iOS - Android might need some testing
         * @param  {Element} el  target element / jquery selector (in subsequent nodes)
         * @param  {int}     hop current hop compared to options.normalScrollElementTouchThreshold
         * @return {boolean} true if there is a match to options.normalScrollElements
         */
        function checkParentForNormalScrollElement (el, hop) {
            hop = hop || 0;
            var parent = $(el).parent();

            if (hop < options.normalScrollElementTouchThreshold &&
                parent.is(options.normalScrollElements) ) {
                return true;
            } else if (hop == options.normalScrollElementTouchThreshold) {
                return false;
            } else {
                return checkParentForNormalScrollElement(parent, ++hop);
            }
        }

        /**
        * As IE >= 10 fires both touch and mouse events when using a mouse in a touchscreen
        * this way we make sure that is really a touch event what IE is detecting.
        */
        function isReallyTouch(e){
            //if is not IE   ||  IE is detecting `touch` or `pen`
            return typeof e.pointerType === 'undefined' || e.pointerType != 'mouse';
        }

        /**
        * Handler for the touch start event.
        */
        function touchStartHandler(event){
            var e = event.originalEvent;

            //stopping the auto scroll to adjust to a section
            if(options.fitToSection){
                $htmlBody.stop();
            }

            if(isReallyTouch(e)){
                var touchEvents = getEventsPage(e);
                touchStartY = touchEvents.y;
                touchStartX = touchEvents.x;
            }
        }

        /**
        * Gets the average of the last `number` elements of the given array.
        */
        function getAverage(elements, number){
            var sum = 0;

            //taking `number` elements from the end to make the average, if there are not enought, 1
            var lastElements = elements.slice(Math.max(elements.length - number, 1));

            for(var i = 0; i < lastElements.length; i++){
                sum = sum + lastElements[i];
            }

            return Math.ceil(sum/number);
        }

        /**
         * Detecting mousewheel scrolling
         *
         * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
         * http://www.sitepoint.com/html5-javascript-mouse-wheel/
         */
        var prevTime = new Date().getTime();

        function MouseWheelHandler(e) {
            var curTime = new Date().getTime();
            var isNormalScroll = $(COMPLETELY_SEL).hasClass(NORMAL_SCROLL);

            //autoscrolling and not zooming?
            if(options.autoScrolling && !controlPressed && !isNormalScroll){
                // cross-browser wheel delta
                e = e || window.event;
                var value = e.wheelDelta || -e.deltaY || -e.detail;
                var delta = Math.max(-1, Math.min(1, value));

                var horizontalDetection = typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined';
                var isScrollingVertically = (Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta)) || (Math.abs(e.deltaX ) < Math.abs(e.deltaY) || !horizontalDetection);

                //Limiting the array to 150 (lets not waste memory!)
                if(scrollings.length > 149){
                    scrollings.shift();
                }

                //keeping record of the previous scrollings
                scrollings.push(Math.abs(value));

                //preventing to scroll the site on mouse wheel when scrollbar is present
                if(options.scrollBar){
                    e.preventDefault ? e.preventDefault() : e.returnValue = false;
                }

                var activeSection = $(SECTION_ACTIVE_SEL);
                var scrollable = options.scrollOverflowHandler.scrollable(activeSection);

                //time difference between the last scroll and the current one
                var timeDiff = curTime-prevTime;
                prevTime = curTime;

                //haven't they scrolled in a while?
                //(enough to be consider a different scrolling action to scroll another section)
                if(timeDiff > 200){
                    //emptying the array, we dont care about old scrollings for our averages
                    scrollings = [];
                }

                if(canScroll){
                    var averageEnd = getAverage(scrollings, 10);
                    var averageMiddle = getAverage(scrollings, 70);
                    var isAccelerating = averageEnd >= averageMiddle;

                    //to avoid double swipes...
                    if(isAccelerating && isScrollingVertically){
                        //scrolling down?
                        if (delta < 0) {
                            scrolling('down', scrollable);

                        //scrolling up?
                        }else {
                            scrolling('up', scrollable);
                        }
                    }
                }

                return false;
            }

            if(options.fitToSection){
                //stopping the auto scroll to adjust to a section
                $htmlBody.stop();
            }
        }

        /**
        * Slides a slider to the given direction.
        * Optional `section` param.
        */
        function moveSlide(direction, section){
            var activeSection = typeof section === 'undefined' ? $(SECTION_ACTIVE_SEL) : section;
            var slides = activeSection.find(SLIDES_WRAPPER_SEL);
            var numSlides = slides.find(SLIDE_SEL).length;

            // more than one slide needed and nothing should be sliding
            if (!slides.length || slideMoving || numSlides < 2) {
                return;
            }

            var currentSlide = slides.find(SLIDE_ACTIVE_SEL);
            var destiny = null;

            if(direction === 'prev'){
                destiny = currentSlide.prev(SLIDE_SEL);
            }else{
                destiny = currentSlide.next(SLIDE_SEL);
            }

            //isn't there a next slide in the secuence?
            if(!destiny.length){
                //respect loopHorizontal settin
                if (!options.loopHorizontal) return;

                if(direction === 'prev'){
                    destiny = currentSlide.siblings(':last');
                }else{
                    destiny = currentSlide.siblings(':first');
                }
            }

            slideMoving = true;

            landscapeScroll(slides, destiny);
        }

        /**
        * Maintains the active slides in the viewport
        * (Because he `scroll` animation might get lost with some actions, such as when using continuousVertical)
        */
        function keepSlidesPosition(){
            $(SLIDE_ACTIVE_SEL).each(function(){
                silentLandscapeScroll($(this), 'internal');
            });
        }

        var previousDestTop = 0;
        /**
        * Returns the destination Y position based on the scrolling direction and
        * the height of the section.
        */
        function getDestinationPosition(element){
            var elemPosition = element.position();

            //top of the desination will be at the top of the viewport
            var position = elemPosition.top;
            var isScrollingDown =  elemPosition.top > previousDestTop;
            var sectionBottom = position - windowsHeight + element.outerHeight();

            //is the destination element bigger than the viewport?
            if(element.outerHeight() > windowsHeight){
                //scrolling up?
                if(!isScrollingDown){
                    position = sectionBottom;
                }
            }

            //sections equal or smaller than the viewport height && scrolling down? ||  is resizing and its in the last section
            else if(isScrollingDown || (isResizing && element.is(':last-child')) ){
                //The bottom of the destination will be at the bottom of the viewport
                position = sectionBottom;
            }

            /*
            Keeping record of the last scrolled position to determine the scrolling direction.
            No conventional methods can be used as the scroll bar might not be present
            AND the section might not be active if it is auto-height and didnt reach the middle
            of the viewport.
            */
            previousDestTop = position;
            return position;
        }

        /**
        * Scrolls the site to the given element and scrolls to the slide if a callback is given.
        */
        function scrollPage(element, callback, isMovementUp){
            if(typeof element === 'undefined'){ return; } //there's no element to scroll, leaving the function

            var dtop = getDestinationPosition(element);

            //local variables
            var v = {
                element: element,
                callback: callback,
                isMovementUp: isMovementUp,
                dtop: dtop,
                yMovement: getYmovement(element),
                anchorLink: element.data('anchor'),
                sectionIndex: element.index(SECTION_SEL),
                activeSlide: element.find(SLIDE_ACTIVE_SEL),
                activeSection: $(SECTION_ACTIVE_SEL),
                leavingSection: $(SECTION_ACTIVE_SEL).index(SECTION_SEL) + 1,

                //caching the value of isResizing at the momment the function is called
                //because it will be checked later inside a setTimeout and the value might change
                localIsResizing: isResizing
            };

            //quiting when destination scroll is the same as the current one
            if((v.activeSection.is(element) && !isResizing) || (options.scrollBar && $window.scrollTop() === v.dtop && !element.hasClass(AUTO_HEIGHT) )){ return; }

            if(v.activeSlide.length){
                var slideAnchorLink = v.activeSlide.data('anchor');
                var slideIndex = v.activeSlide.index();
            }

            // If continuousVertical && we need to wrap around
            if (options.autoScrolling && options.continuousVertical && typeof (v.isMovementUp) !== "undefined" &&
                ((!v.isMovementUp && v.yMovement == 'up') || // Intending to scroll down but about to go up or
                (v.isMovementUp && v.yMovement == 'down'))) { // intending to scroll up but about to go down

                v = createInfiniteSections(v);
            }

            //callback (onLeave) if the site is not just resizing and readjusting the slides
            if($.isFunction(options.onLeave) && !v.localIsResizing){
                if(options.onLeave.call(v.activeSection, v.leavingSection, (v.sectionIndex + 1), v.yMovement) === false){
                    return;
                }
            }
            stopMedia(v.activeSection);

            element.addClass(ACTIVE).siblings().removeClass(ACTIVE);
            lazyLoad(element);

            //preventing from activating the MouseWheelHandler event
            //more than once if the page is scrolling
            canScroll = false;

            setState(slideIndex, slideAnchorLink, v.anchorLink, v.sectionIndex);

            performMovement(v);

            //flag to avoid callingn `scrollPage()` twice in case of using anchor links
            lastScrolledDestiny = v.anchorLink;

            //avoid firing it twice (as it does also on scroll)
            activateMenuAndNav(v.anchorLink, v.sectionIndex);
        }

        /**
        * Performs the movement (by CSS3 or by jQuery)
        */
        function performMovement(v){
            // using CSS3 translate functionality
            if (options.css3 && options.autoScrolling && !options.scrollBar) {
                var translate3d = 'translate3d(0px, -' + v.dtop + 'px, 0px)';
                transformContainer(translate3d, true);

                //even when the scrollingSpeed is 0 there's a little delay, which might cause the
                //scrollingSpeed to change in case of using silentMoveTo();
                if(options.scrollingSpeed){
                    afterSectionLoadsId = setTimeout(function () {
                        afterSectionLoads(v);
                    }, options.scrollingSpeed);
                }else{
                    afterSectionLoads(v);
                }
            }

            // using jQuery animate
            else{
                var scrollSettings = getScrollSettings(v);

                $(scrollSettings.element).animate(
                    scrollSettings.options,
                options.scrollingSpeed, options.easing).promise().done(function () { //only one single callback in case of animating  `html, body`
                    if(options.scrollBar){

                        /* Hack!
                        The timeout prevents setting the most dominant section in the viewport as "active" when the user
                        scrolled to a smaller section by using the mousewheel (auto scrolling) rather than draging the scroll bar.

                        When using scrollBar:true It seems like the scroll events still getting propagated even after the scrolling animation has finished.
                        */
                        setTimeout(function(){
                            afterSectionLoads(v);
                        },30);
                    }else{
                        afterSectionLoads(v);
                    }
                });
            }
        }

        /**
        * Gets the scrolling settings depending on the plugin autoScrolling option
        */
        function getScrollSettings(v){
            var scroll = {};

            if(options.autoScrolling && !options.scrollBar){
                scroll.options = { 'top': -v.dtop};
                scroll.element = WRAPPER_SEL;
            }else{
                scroll.options = { 'scrollTop': v.dtop};
                scroll.element = 'html, body';
            }

            return scroll;
        }

        /**
        * Adds sections before or after the current one to create the infinite effect.
        */
        function createInfiniteSections(v){
            // Scrolling down
            if (!v.isMovementUp) {
                // Move all previous sections to after the active section
                $(SECTION_ACTIVE_SEL).after(v.activeSection.prevAll(SECTION_SEL).get().reverse());
            }
            else { // Scrolling up
                // Move all next sections to before the active section
                $(SECTION_ACTIVE_SEL).before(v.activeSection.nextAll(SECTION_SEL));
            }

            // Maintain the displayed position (now that we changed the element order)
            silentScroll($(SECTION_ACTIVE_SEL).position().top);

            // Maintain the active slides visible in the viewport
            keepSlidesPosition();

            // save for later the elements that still need to be reordered
            v.wrapAroundElements = v.activeSection;

            // Recalculate animation variables
            v.dtop = v.element.position().top;
            v.yMovement = getYmovement(v.element);

            return v;
        }

        /**
        * Fix section order after continuousVertical changes have been animated
        */
        function continuousVerticalFixSectionOrder (v) {
            // If continuousVertical is in effect (and autoScrolling would also be in effect then),
            // finish moving the elements around so the direct navigation will function more simply
            if (!v.wrapAroundElements || !v.wrapAroundElements.length) {
                return;
            }

            if (v.isMovementUp) {
                $(SECTION_FIRST_SEL).before(v.wrapAroundElements);
            }
            else {
                $(SECTION_LAST_SEL).after(v.wrapAroundElements);
            }

            silentScroll($(SECTION_ACTIVE_SEL).position().top);

            // Maintain the active slides visible in the viewport
            keepSlidesPosition();
        }


        /**
        * Actions to do once the section is loaded.
        */
        function afterSectionLoads (v){
            continuousVerticalFixSectionOrder(v);

            v.element.find('.fp-scrollable').mouseover();

            //callback (afterLoad) if the site is not just resizing and readjusting the slides
            $.isFunction(options.afterLoad) && !v.localIsResizing && options.afterLoad.call(v.element, v.anchorLink, (v.sectionIndex + 1));

            playMedia(v.element);
            v.element.addClass(COMPLETELY).siblings().removeClass(COMPLETELY);

            canScroll = true;

            $.isFunction(v.callback) && v.callback.call(this);
        }

        /**
        * Lazy loads image, video and audio elements.
        */
        function lazyLoad(destiny){
            var destiny = getSlideOrSection(destiny);

            destiny.find('img[data-src], source[data-src], audio[data-src]').each(function(){
                $(this).attr('src', $(this).data('src'));
                $(this).removeAttr('data-src');

                if($(this).is('source')){
                    $(this).closest('video').get(0).load();
                }
            });
        }

        /**
        * Plays video and audio elements.
        */
        function playMedia(destiny){
            var destiny = getSlideOrSection(destiny);

            //playing HTML5 media elements
            destiny.find('video, audio').each(function(){
                var element = $(this).get(0);

                if( element.hasAttribute('autoplay') && typeof element.play === 'function' ) {
                    element.play();
                }
            });
        }

        /**
        * Stops video and audio elements.
        */
        function stopMedia(destiny){
            var destiny = getSlideOrSection(destiny);

            //stopping HTML5 media elements
            destiny.find('video, audio').each(function(){
                var element = $(this).get(0);

                if( !element.hasAttribute('data-ignore') && typeof element.pause === 'function' ) {
                    element.pause();
                }
            });
        }

        /**
        * Gets the active slide (or section) for the given section
        */
        function getSlideOrSection(destiny){
            var slide = destiny.find(SLIDE_ACTIVE_SEL);
            if( slide.length ) {
                destiny = $(slide);
            }

            return destiny;
        }

        /**
        * Scrolls to the anchor in the URL when loading the site
        */
        function scrollToAnchor(){
            //getting the anchor link in the URL and deleting the `#`
            var value =  window.location.hash.replace('#', '').split('/');
            var section = value[0];
            var slide = value[1];

            if(section){  //if theres any #
                if(options.animateAnchor){
                    scrollPageAndSlide(section, slide);
                }else{
                    FP.silentMoveTo(section, slide);
                }
            }
        }

        /**
        * Detecting any change on the URL to scroll to the given anchor link
        * (a way to detect back history button as we play with the hashes on the URL)
        */
        function hashChangeHandler(){
            if(!isScrolling && !options.lockAnchors){
                var value =  window.location.hash.replace('#', '').split('/');
                var section = value[0];
                var slide = value[1];

                    //when moving to a slide in the first section for the first time (first time to add an anchor to the URL)
                    var isFirstSlideMove =  (typeof lastScrolledDestiny === 'undefined');
                    var isFirstScrollMove = (typeof lastScrolledDestiny === 'undefined' && typeof slide === 'undefined' && !slideMoving);


                if(section.length){
                    /*in order to call scrollpage() only once for each destination at a time
                    It is called twice for each scroll otherwise, as in case of using anchorlinks `hashChange`
                    event is fired on every scroll too.*/
                    if ((section && section !== lastScrolledDestiny) && !isFirstSlideMove || isFirstScrollMove || (!slideMoving && lastScrolledSlide != slide ))  {
                        scrollPageAndSlide(section, slide);
                    }
                }
            }
        }

        //Sliding with arrow keys, both, vertical and horizontal
        function keydownHandler(e) {

            clearTimeout(keydownId);

            var activeElement = $(':focus');

            if(!activeElement.is('textarea') && !activeElement.is('input') && !activeElement.is('select') &&
                activeElement.attr('contentEditable') !== "true" && activeElement.attr('contentEditable') !== '' &&
                options.keyboardScrolling && options.autoScrolling){
                var keyCode = e.which;

                //preventing the scroll with arrow keys & spacebar & Page Up & Down keys
                var keyControls = [40, 38, 32, 33, 34];
                if($.inArray(keyCode, keyControls) > -1){
                    e.preventDefault();
                }

                controlPressed = e.ctrlKey;

                keydownId = setTimeout(function(){
                    onkeydown(e);
                },150);
            }
        }

        function tooltipTextHandler(){
            $(this).prev().trigger('click');
        }

        //to prevent scrolling while zooming
        function keyUpHandler(e){
            if(isWindowFocused){ //the keyup gets fired on new tab ctrl + t in Firefox
                controlPressed = e.ctrlKey;
            }
        }

        //binding the mousemove when the mouse's middle button is released
        function mouseDownHandler(e){
            //middle button
            if (e.which == 2){
                oldPageY = e.pageY;
                container.on('mousemove', mouseMoveHandler);
            }
        }

        //unbinding the mousemove when the mouse's middle button is released
        function mouseUpHandler(e){
            //middle button
            if (e.which == 2){
                container.off('mousemove');
            }
        }

        //Scrolling horizontally when clicking on the slider controls.
        function slideArrowHandler(){
            var section = $(this).closest(SECTION_SEL);

            if ($(this).hasClass(SLIDES_PREV)) {
                if(isScrollAllowed.m.left){
                    FP.moveSlideLeft(section);
                }
            } else {
                if(isScrollAllowed.m.right){
                    FP.moveSlideRight(section);
                }
            }
        }

        //when opening a new tab (ctrl + t), `control` won't be pressed when comming back.
        function blurHandler(){
            isWindowFocused = false;
            controlPressed = false;
        }

        //Scrolls to the section when clicking the navigation bullet
        function sectionBulletHandler(e){
            e.preventDefault();
            var index = $(this).parent().index();
            scrollPage($(SECTION_SEL).eq(index));
        }

        //Scrolls the slider to the given slide destination for the given section
        function slideBulletHandler(e){
            e.preventDefault();
            var slides = $(this).closest(SECTION_SEL).find(SLIDES_WRAPPER_SEL);
            var destiny = slides.find(SLIDE_SEL).eq($(this).closest('li').index());

            landscapeScroll(slides, destiny);
        }

        /**
        * Keydown event
        */
        function onkeydown(e){
            var shiftPressed = e.shiftKey;

            switch (e.which) {
                //up
                case 38:
                case 33:
                    if(isScrollAllowed.k.up){
                        FP.moveSectionUp();
                    }
                    break;

                //down
                case 32: //spacebar
                    if(shiftPressed && isScrollAllowed.k.up){
                        FP.moveSectionUp();
                        break;
                    }
                case 40:
                case 34:
                    if(isScrollAllowed.k.down){
                        FP.moveSectionDown();
                    }
                    break;

                //Home
                case 36:
                    if(isScrollAllowed.k.up){
                        FP.moveTo(1);
                    }
                    break;

                //End
                case 35:
                     if(isScrollAllowed.k.down){
                        FP.moveTo( $(SECTION_SEL).length );
                    }
                    break;

                //left
                case 37:
                    if(isScrollAllowed.k.left){
                        FP.moveSlideLeft();
                    }
                    break;

                //right
                case 39:
                    if(isScrollAllowed.k.right){
                        FP.moveSlideRight();
                    }
                    break;

                default:
                    return; // exit this handler for other keys
            }
        }

        /**
        * Detecting the direction of the mouse movement.
        * Used only for the middle button of the mouse.
        */
        var oldPageY = 0;
        function mouseMoveHandler(e){
            if(canScroll){
                // moving up
                if (e.pageY < oldPageY && isScrollAllowed.m.up){
                    FP.moveSectionUp();
                }

                // moving down
                else if(e.pageY > oldPageY && isScrollAllowed.m.down){
                    FP.moveSectionDown();
                }
            }
            oldPageY = e.pageY;
        }

        /**
        * Scrolls horizontal sliders.
        */
        function landscapeScroll(slides, destiny){
            var destinyPos = destiny.position();
            var slideIndex = destiny.index();
            var section = slides.closest(SECTION_SEL);
            var sectionIndex = section.index(SECTION_SEL);
            var anchorLink = section.data('anchor');
            var slidesNav = section.find(SLIDES_NAV_SEL);
            var slideAnchor = getAnchor(destiny);
            var prevSlide = section.find(SLIDE_ACTIVE_SEL);

            //caching the value of isResizing at the momment the function is called
            //because it will be checked later inside a setTimeout and the value might change
            var localIsResizing = isResizing;

            if(options.onSlideLeave){
                var prevSlideIndex = prevSlide.index();
                var xMovement = getXmovement(prevSlideIndex, slideIndex);

                //if the site is not just resizing and readjusting the slides
                if(!localIsResizing && xMovement!=='none'){
                    if($.isFunction( options.onSlideLeave )){
                        if(options.onSlideLeave.call( prevSlide, anchorLink, (sectionIndex + 1), prevSlideIndex, xMovement, slideIndex ) === false){
                            slideMoving = false;
                            return;
                        }
                    }
                }
            }
            stopMedia(prevSlide);

            destiny.addClass(ACTIVE).siblings().removeClass(ACTIVE);
            if(!localIsResizing){
                lazyLoad(destiny);
            }

            if(!options.loopHorizontal && options.controlArrows){
                //hidding it for the fist slide, showing for the rest
                section.find(SLIDES_ARROW_PREV_SEL).toggle(slideIndex!==0);

                //hidding it for the last slide, showing for the rest
                section.find(SLIDES_ARROW_NEXT_SEL).toggle(!destiny.is(':last-child'));
            }

            //only changing the URL if the slides are in the current section (not for resize re-adjusting)
            if(section.hasClass(ACTIVE)){
                setState(slideIndex, slideAnchor, anchorLink, sectionIndex);
            }

            var afterSlideLoads = function(){
                //if the site is not just resizing and readjusting the slides
                if(!localIsResizing){
                    $.isFunction( options.afterSlideLoad ) && options.afterSlideLoad.call( destiny, anchorLink, (sectionIndex + 1), slideAnchor, slideIndex);
                }
                playMedia(destiny);

                //letting them slide again
                slideMoving = false;
            };

            if(options.css3){
                var translate3d = 'translate3d(-' + Math.round(destinyPos.left) + 'px, 0px, 0px)';

                addAnimation(slides.find(SLIDES_CONTAINER_SEL), options.scrollingSpeed>0).css(getTransforms(translate3d));

                afterSlideLoadsId = setTimeout(function(){
                    afterSlideLoads();
                }, options.scrollingSpeed, options.easing);
            }else{
                slides.animate({
                    scrollLeft : Math.round(destinyPos.left)
                }, options.scrollingSpeed, options.easing, function() {

                    afterSlideLoads();
                });
            }

            slidesNav.find(ACTIVE_SEL).removeClass(ACTIVE);
            slidesNav.find('li').eq(slideIndex).find('a').addClass(ACTIVE);
        }

        var previousHeight = windowsHeight;

        //when resizing the site, we adjust the heights of the sections, slimScroll...
        function resizeHandler(){
            //checking if it needs to get responsive
            responsive();

            // rebuild immediately on touch devices
            if (isTouchDevice) {
                var activeElement = $(document.activeElement);

                //if the keyboard is NOT visible
                if (!activeElement.is('textarea') && !activeElement.is('input') && !activeElement.is('select')) {
                    var currentHeight = $window.height();

                    //making sure the change in the viewport size is enough to force a rebuild. (20 % of the window to avoid problems when hidding scroll bars)
                    if( Math.abs(currentHeight - previousHeight) > (20 * Math.max(previousHeight, currentHeight) / 100) ){
                        FP.reBuild(true);
                        previousHeight = currentHeight;
                    }
                }
            }else{
                //in order to call the functions only when the resize is finished
                //http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
                clearTimeout(resizeId);

                resizeId = setTimeout(function(){
                    FP.reBuild(true);
                }, 350);
            }
        }

        /**
        * Checks if the site needs to get responsive and disables autoScrolling if so.
        * A class `fp-responsive` is added to the plugin's container in case the user wants to use it for his own responsive CSS.
        */
        function responsive(){
            var widthLimit = options.responsive || options.responsiveWidth; //backwards compatiblity
            var heightLimit = options.responsiveHeight;

            //only calculating what we need. Remember its called on the resize event.
            var isBreakingPointWidth = widthLimit && $window.outerWidth() < widthLimit;
            var isBreakingPointHeight = heightLimit && $window.height() < heightLimit;

            if(widthLimit && heightLimit){
                FP.setResponsive(isBreakingPointWidth || isBreakingPointHeight);
            }
            else if(widthLimit){
                FP.setResponsive(isBreakingPointWidth);
            }
            else if(heightLimit){
                FP.setResponsive(isBreakingPointHeight);
            }
        }

        /**
        * Adds transition animations for the given element
        */
        function addAnimation(element){
            var transition = 'all ' + options.scrollingSpeed + 'ms ' + options.easingcss3;

            element.removeClass(NO_TRANSITION);
            return element.css({
                '-webkit-transition': transition,
                'transition': transition
            });
        }

        /**
        * Remove transition animations for the given element
        */
        function removeAnimation(element){
            return element.addClass(NO_TRANSITION);
        }

        /**
         * Resizing of the font size depending on the window size as well as some of the images on the site.
         */
        function resizeMe(displayHeight, displayWidth) {
            //Standard dimensions, for which the body font size is correct
            var preferredHeight = 825;
            var preferredWidth = 900;

            if (displayHeight < preferredHeight || displayWidth < preferredWidth) {
                var heightPercentage = (displayHeight * 100) / preferredHeight;
                var widthPercentage = (displayWidth * 100) / preferredWidth;
                var percentage = Math.min(heightPercentage, widthPercentage);
                var newFontSize = percentage.toFixed(2);

                $body.css('font-size', newFontSize + '%');
            } else {
                $body.css('font-size', '100%');
            }
        }

        /**
         * Activating the website navigation dots according to the given slide name.
         */
        function activateNavDots(name, sectionIndex){
            if(options.navigation){
                $(SECTION_NAV_SEL).find(ACTIVE_SEL).removeClass(ACTIVE);
                if(name){
                    $(SECTION_NAV_SEL).find('a[href="#' + name + '"]').addClass(ACTIVE);
                }else{
                    $(SECTION_NAV_SEL).find('li').eq(sectionIndex).find('a').addClass(ACTIVE);
                }
            }
        }

        /**
         * Activating the website main menu elements according to the given slide name.
         */
        function activateMenuElement(name){
            if(options.menu){
                $(options.menu).find(ACTIVE_SEL).removeClass(ACTIVE);
                $(options.menu).find('[data-menuanchor="'+name+'"]').addClass(ACTIVE);
            }
        }

        /**
        * Sets to active the current menu and vertical nav items.
        */
        function activateMenuAndNav(anchor, index){
            activateMenuElement(anchor);
            activateNavDots(anchor, index);
        }

        /**
        * Retuns `up` or `down` depending on the scrolling movement to reach its destination
        * from the current section.
        */
        function getYmovement(destiny){
            var fromIndex = $(SECTION_ACTIVE_SEL).index(SECTION_SEL);
            var toIndex = destiny.index(SECTION_SEL);
            if( fromIndex == toIndex){
                return 'none';
            }
            if(fromIndex > toIndex){
                return 'up';
            }
            return 'down';
        }

        /**
        * Retuns `right` or `left` depending on the scrolling movement to reach its destination
        * from the current slide.
        */
        function getXmovement(fromIndex, toIndex){
            if( fromIndex == toIndex){
                return 'none';
            }
            if(fromIndex > toIndex){
                return 'left';
            }
            return 'right';
        }


        function createSlimScrolling(element){
            //needed to make `scrollHeight` work under Opera 12
            element.css('overflow', 'hidden');

            var scrollOverflowHandler = options.scrollOverflowHandler;
            var wrap = scrollOverflowHandler.wrapContent();
            //in case element is a slide
            var section = element.closest(SECTION_SEL);
            var scrollable = scrollOverflowHandler.scrollable(element);
            var contentHeight;

            //if there was scroll, the contentHeight will be the one in the scrollable section
            if(scrollable.length){
                contentHeight = scrollOverflowHandler.scrollHeight(element);
            }else{
                contentHeight = element.get(0).scrollHeight;
                if(options.verticalCentered){
                    contentHeight = element.find(TABLE_CELL_SEL).get(0).scrollHeight;
                }
            }

            var scrollHeight = windowsHeight - parseInt(section.css('padding-bottom')) - parseInt(section.css('padding-top'));

            //needs scroll?
            if ( contentHeight > scrollHeight) {
                //was there already an scroll ? Updating it
                if(scrollable.length){
                    scrollOverflowHandler.update(element, scrollHeight);
                }
                //creating the scrolling
                else{
                    if(options.verticalCentered){
                        element.find(TABLE_CELL_SEL).wrapInner(wrap);
                    }else{
                        element.wrapInner(wrap);
                    }
                    scrollOverflowHandler.create(element, scrollHeight);
                }
            }
            //removing the scrolling when it is not necessary anymore
            else{
                scrollOverflowHandler.remove(element);
            }

            //undo
            element.css('overflow', '');
        }

        function addTableClass(element){
            element.addClass(TABLE).wrapInner('<div class="' + TABLE_CELL + '" style="height:' + getTableHeight(element) + 'px;" />');
        }

        function getTableHeight(element){
            var sectionHeight = windowsHeight;

            if(options.paddingTop || options.paddingBottom){
                var section = element;
                if(!section.hasClass(SECTION)){
                    section = element.closest(SECTION_SEL);
                }

                var paddings = parseInt(section.css('padding-top')) + parseInt(section.css('padding-bottom'));
                sectionHeight = (windowsHeight - paddings);
            }

            return sectionHeight;
        }

        /**
        * Adds a css3 transform property to the container class with or without animation depending on the animated param.
        */
        function transformContainer(translate3d, animated){
            if(animated){
                addAnimation(container);
            }else{
                removeAnimation(container);
            }

            container.css(getTransforms(translate3d));

            //syncronously removing the class after the animation has been applied.
            setTimeout(function(){
                container.removeClass(NO_TRANSITION);
            },10);
        }

        /**
        * Gets a section by its anchor / index
        */
        function getSectionByAnchor(sectionAnchor){
            //section
            var section = container.find(SECTION_SEL + '[data-anchor="'+sectionAnchor+'"]');
            if(!section.length){
                section = $(SECTION_SEL).eq( (sectionAnchor -1) );
            }

            return section;
        }

        /**
        * Gets a slide inside a given section by its anchor / index
        */
        function getSlideByAnchor(slideAnchor, section){
            var slides = section.find(SLIDES_WRAPPER_SEL);
            var slide =  slides.find(SLIDE_SEL + '[data-anchor="'+slideAnchor+'"]');

            if(!slide.length){
                slide = slides.find(SLIDE_SEL).eq(slideAnchor);
            }

            return slide;
        }

        /**
        * Scrolls to the given section and slide anchors
        */
        function scrollPageAndSlide(destiny, slide){
            var section = getSectionByAnchor(destiny);

            //default slide
            if (typeof slide === 'undefined') {
                slide = 0;
            }

            //we need to scroll to the section and then to the slide
            if (destiny !== lastScrolledDestiny && !section.hasClass(ACTIVE)){
                scrollPage(section, function(){
                    scrollSlider(section, slide);
                });
            }
            //if we were already in the section
            else{
                scrollSlider(section, slide);
            }
        }

        /**
        * Scrolls the slider to the given slide destination for the given section
        */
        function scrollSlider(section, slideAnchor){
            if(typeof slideAnchor !== 'undefined'){
                var slides = section.find(SLIDES_WRAPPER_SEL);
                var destiny =  getSlideByAnchor(slideAnchor, section);

                if(destiny.length){
                    landscapeScroll(slides, destiny);
                }
            }
        }

        /**
        * Creates a landscape navigation bar with dots for horizontal sliders.
        */
        function addSlidesNavigation(section, numSlides){
            section.append('<div class="' + SLIDES_NAV + '"><ul></ul></div>');
            var nav = section.find(SLIDES_NAV_SEL);

            //top or bottom
            nav.addClass(options.slidesNavPosition);

            for(var i=0; i< numSlides; i++){
                nav.find('ul').append('<li><a href="#"><span></span></a></li>');
            }

            //centering it
            nav.css('margin-left', '-' + (nav.width()/2) + 'px');

            nav.find('li').first().find('a').addClass(ACTIVE);
        }


        /**
        * Sets the state of the website depending on the active section/slide.
        * It changes the URL hash when needed and updates the body class.
        */
        function setState(slideIndex, slideAnchor, anchorLink, sectionIndex){
            var sectionHash = '';

            if(options.anchors.length && !options.lockAnchors){

                //isn't it the first slide?
                if(slideIndex){
                    if(typeof anchorLink !== 'undefined'){
                        sectionHash = anchorLink;
                    }

                    //slide without anchor link? We take the index instead.
                    if(typeof slideAnchor === 'undefined'){
                        slideAnchor = slideIndex;
                    }

                    lastScrolledSlide = slideAnchor;
                    setUrlHash(sectionHash + '/' + slideAnchor);

                //first slide won't have slide anchor, just the section one
                }else if(typeof slideIndex !== 'undefined'){
                    lastScrolledSlide = slideAnchor;
                    setUrlHash(anchorLink);
                }

                //section without slides
                else{
                    setUrlHash(anchorLink);
                }
            }

            setBodyClass();
        }

        /**
        * Sets the URL hash.
        */
        function setUrlHash(url){
            if(options.recordHistory){
                location.hash = url;
            }else{
                //Mobile Chrome doesn't work the normal way, so... lets use HTML5 for phones :)
                if(isTouchDevice || isTouch){
                    window.history.replaceState(undefined, undefined, '#' + url);
                }else{
                    var baseUrl = window.location.href.split('#')[0];
                    window.location.replace( baseUrl + '#' + url );
                }
            }
        }

        /**
        * Gets the anchor for the given slide / section. Its index will be used if there's none.
        */
        function getAnchor(element){
            var anchor = element.data('anchor');
            var index = element.index();

            //Slide without anchor link? We take the index instead.
            if(typeof anchor === 'undefined'){
                anchor = index;
            }

            return anchor;
        }

        /**
        * Sets a class for the body of the page depending on the active section / slide
        */
        function setBodyClass(){
            var section = $(SECTION_ACTIVE_SEL);
            var slide = section.find(SLIDE_ACTIVE_SEL);

            var sectionAnchor = getAnchor(section);
            var slideAnchor = getAnchor(slide);

            var sectionIndex = section.index(SECTION_SEL);

            var text = String(sectionAnchor);

            if(slide.length){
                text = text + '-' + slideAnchor;
            }

            //changing slash for dash to make it a valid CSS style
            text = text.replace('/', '-').replace('#','');

            //removing previous anchor classes
            var classRe = new RegExp('\\b\\s?' + VIEWING_PREFIX + '-[^\\s]+\\b', "g");
            $body[0].className = $body[0].className.replace(classRe, '');

            //adding the current anchor
            $body.addClass(VIEWING_PREFIX + '-' + text);
        }

        /**
        * Checks for translate3d support
        * @return boolean
        * http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
        */
        function support3d() {
            var el = document.createElement('p'),
                has3d,
                transforms = {
                    'webkitTransform':'-webkit-transform',
                    'OTransform':'-o-transform',
                    'msTransform':'-ms-transform',
                    'MozTransform':'-moz-transform',
                    'transform':'transform'
                };

            // Add it to the body to get the computed style.
            document.body.insertBefore(el, null);

            for (var t in transforms) {
                if (el.style[t] !== undefined) {
                    el.style[t] = 'translate3d(1px,1px,1px)';
                    has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                }
            }

            document.body.removeChild(el);

            return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
        }

        /**
        * Removes the auto scrolling action fired by the mouse wheel and trackpad.
        * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
        */
        function removeMouseWheelHandler(){
            if (document.addEventListener) {
                document.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
                document.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
                document.removeEventListener('MozMousePixelScroll', MouseWheelHandler, false); //old Firefox
            } else {
                document.detachEvent('onmousewheel', MouseWheelHandler); //IE 6/7/8
            }
        }

        /**
        * Adds the auto scrolling action for the mouse wheel and trackpad.
        * After this function is called, the mousewheel and trackpad movements will scroll through sections
        * https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        */
        function addMouseWheelHandler(){
            var prefix = '';
            var _addEventListener;

            if (window.addEventListener){
                _addEventListener = "addEventListener";
            }else{
                _addEventListener = "attachEvent";
                prefix = 'on';
            }

             // detect available wheel event
            var support = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"
                      document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
                      'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox


            if(support == 'DOMMouseScroll'){
                document[ _addEventListener ](prefix + 'MozMousePixelScroll', MouseWheelHandler, false);
            }

            //handle MozMousePixelScroll in older Firefox
            else{
                document[ _addEventListener ](prefix + support, MouseWheelHandler, false);
            }
        }

        /**
        * Binding the mousemove when the mouse's middle button is pressed
        */
        function addMiddleWheelHandler(){
            container
                .on('mousedown', mouseDownHandler)
                .on('mouseup', mouseUpHandler);
        }

        /**
        * Unbinding the mousemove when the mouse's middle button is released
        */
        function removeMiddleWheelHandler(){
            container
                .off('mousedown', mouseDownHandler)
                .off('mouseup', mouseUpHandler);
        }

        /**
        * Adds the possibility to auto scroll through sections on touch devices.
        */
        function addTouchHandler(){
            if(isTouchDevice || isTouch){
                //Microsoft pointers
                var MSPointer = getMSPointer();

                $(WRAPPER_SEL).off('touchstart ' +  MSPointer.down).on('touchstart ' + MSPointer.down, touchStartHandler);
                $(WRAPPER_SEL).off('touchmove ' + MSPointer.move).on('touchmove ' + MSPointer.move, touchMoveHandler);
            }
        }

        /**
        * Removes the auto scrolling for touch devices.
        */
        function removeTouchHandler(){
            if(isTouchDevice || isTouch){
                //Microsoft pointers
                var MSPointer = getMSPointer();

                $(WRAPPER_SEL).off('touchstart ' + MSPointer.down);
                $(WRAPPER_SEL).off('touchmove ' + MSPointer.move);
            }
        }

        /*
        * Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
        * http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
        */
        function getMSPointer(){
            var pointer;

            //IE >= 11 & rest of browsers
            if(window.PointerEvent){
                pointer = { down: 'pointerdown', move: 'pointermove'};
            }

            //IE < 11
            else{
                pointer = { down: 'MSPointerDown', move: 'MSPointerMove'};
            }

            return pointer;
        }

        /**
        * Gets the pageX and pageY properties depending on the browser.
        * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
        */
        function getEventsPage(e){
            var events = [];

            events.y = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
            events.x = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);

            //in touch devices with scrollBar:true, e.pageY is detected, but we have to deal with touch events. #1008
            if(isTouch && isReallyTouch(e) && options.scrollBar){
                events.y = e.touches[0].pageY;
                events.x = e.touches[0].pageX;
            }

            return events;
        }

        /**
        * Slides silently (with no animation) the active slider to the given slide.
        */
        function silentLandscapeScroll(activeSlide, noCallbacks){
            FP.setScrollingSpeed (0, 'internal');

            if(typeof noCallbacks !== 'undefined'){
                //preventing firing callbacks afterSlideLoad etc.
                isResizing = true;
            }

            landscapeScroll(activeSlide.closest(SLIDES_WRAPPER_SEL), activeSlide);

            if(typeof noCallbacks !== 'undefined'){
                isResizing = false;
            }

            FP.setScrollingSpeed(originals.scrollingSpeed, 'internal');
        }

        /**
        * Scrolls silently (with no animation) the page to the given Y position.
        */
        function silentScroll(top){
            if(options.scrollBar){
                container.scrollTop(top);
            }
            else if (options.css3) {
                var translate3d = 'translate3d(0px, -' + top + 'px, 0px)';
                transformContainer(translate3d, false);
            }
            else {
                container.css('top', -top);
            }
        }

        /**
        * Returns the cross-browser transform string.
        */
        function getTransforms(translate3d){
            return {
                '-webkit-transform': translate3d,
                '-moz-transform': translate3d,
                '-ms-transform':translate3d,
                'transform': translate3d
            };
        }

        /**
        * Allowing or disallowing the mouse/swipe scroll in a given direction. (not for keyboard)
        * @type  m (mouse) or k (keyboard)
        */
        function setIsScrollAllowed(value, direction, type){
            switch (direction){
                case 'up': isScrollAllowed[type].up = value; break;
                case 'down': isScrollAllowed[type].down = value; break;
                case 'left': isScrollAllowed[type].left = value; break;
                case 'right': isScrollAllowed[type].right = value; break;
                case 'all':
                    if(type == 'm'){
                        FP.setAllowScrolling(value);
                    }else{
                        FP.setKeyboardScrolling(value);
                    }
            }
        }

        /*
        * Destroys fullpage.js plugin events and optinally its html markup and styles
        */
        FP.destroy = function(all){
            FP.setAutoScrolling(false, 'internal');
            FP.setAllowScrolling(false);
            FP.setKeyboardScrolling(false);
            container.addClass(DESTROYED);

            clearTimeout(afterSlideLoadsId);
            clearTimeout(afterSectionLoadsId);
            clearTimeout(resizeId);
            clearTimeout(scrollId);
            clearTimeout(scrollId2);

            $window
                .off('scroll', scrollHandler)
                .off('hashchange', hashChangeHandler)
                .off('resize', resizeHandler);

            $document
                .off('click', SECTION_NAV_SEL + ' a')
                .off('mouseenter', SECTION_NAV_SEL + ' li')
                .off('mouseleave', SECTION_NAV_SEL + ' li')
                .off('click', SLIDES_NAV_LINK_SEL)
                .off('mouseover', options.normalScrollElements)
                .off('mouseout', options.normalScrollElements);

            $(SECTION_SEL)
                .off('click', SLIDES_ARROW_SEL);

            clearTimeout(afterSlideLoadsId);
            clearTimeout(afterSectionLoadsId);

            //lets make a mess!
            if(all){
                destroyStructure();
            }
        };

        /*
        * Removes inline styles added by fullpage.js
        */
        function destroyStructure(){
            //reseting the `top` or `translate` properties to 0
            silentScroll(0);

            $(SECTION_NAV_SEL + ', ' + SLIDES_NAV_SEL +  ', ' + SLIDES_ARROW_SEL).remove();

            //removing inline styles
            $(SECTION_SEL).css( {
                'height': '',
                'background-color' : '',
                'padding': ''
            });

            $(SLIDE_SEL).css( {
                'width': ''
            });

            container.css({
                'height': '',
                'position': '',
                '-ms-touch-action': '',
                'touch-action': ''
            });

            $htmlBody.css({
                'overflow': '',
                'height': ''
            });

            // remove .fp-enabled class
            $('html').removeClass(ENABLED);

            // remove all of the .fp-viewing- classes
            $.each($body.get(0).className.split(/\s+/), function (index, className) {
                if (className.indexOf(VIEWING_PREFIX) === 0) {
                    $body.removeClass(className);
                }
            });

            //removing added classes
            $(SECTION_SEL + ', ' + SLIDE_SEL).each(function(){
                options.scrollOverflowHandler.remove($(this));
                $(this).removeClass(TABLE + ' ' + ACTIVE);
            });

            removeAnimation(container);

            //Unwrapping content
            container.find(TABLE_CELL_SEL + ', ' + SLIDES_CONTAINER_SEL + ', ' + SLIDES_WRAPPER_SEL).each(function(){
                //unwrap not being use in case there's no child element inside and its just text
                $(this).replaceWith(this.childNodes);
            });

            //scrolling the page to the top with no animation
            $htmlBody.scrollTop(0);

            //removing selectors
            var usedSelectors = [SECTION, SLIDE, SLIDES_CONTAINER];
            $.each(usedSelectors, function(index, value){
                $('.' + value).removeClass(value);
            });
        }

        /*
        * Sets the state for a variable with multiple states (original, and temporal)
        * Some variables such as `autoScrolling` or `recordHistory` might change automatically its state when using `responsive` or `autoScrolling:false`.
        * This function is used to keep track of both states, the original and the temporal one.
        * If type is not 'internal', then we assume the user is globally changing the variable.
        */
        function setVariableState(variable, value, type){
            options[variable] = value;
            if(type !== 'internal'){
                originals[variable] = value;
            }
        }

        /**
        * Displays warnings
        */
        function displayWarnings(){
            if($('html').hasClass(ENABLED)){
                showError('error', 'Fullpage.js can only be initialized once and you are doing it multiple times!');
                return;
            }

            // Disable mutually exclusive settings
            if (options.continuousVertical &&
                (options.loopTop || options.loopBottom)) {
                options.continuousVertical = false;
                showError('warn', 'Option `loopTop/loopBottom` is mutually exclusive with `continuousVertical`; `continuousVertical` disabled');
            }

            if(options.scrollBar && options.scrollOverflow){
                showError('warn', 'Option `scrollBar` is mutually exclusive with `scrollOverflow`. Sections with scrollOverflow might not work well in Firefox');
            }

            if(options.continuousVertical && options.scrollBar){
                options.continuousVertical = false;
                showError('warn', 'Option `scrollBar` is mutually exclusive with `continuousVertical`; `continuousVertical` disabled');
            }

            //anchors can not have the same value as any element ID or NAME
            $.each(options.anchors, function(index, name){

                //case insensitive selectors (http://stackoverflow.com/a/19465187/1081396)
                var nameAttr = $document.find('[name]').filter(function() {
                    return $(this).attr('name') && $(this).attr('name').toLowerCase() == name.toLowerCase();
                });

                var idAttr = $document.find('[id]').filter(function() {
                    return $(this).attr('id') && $(this).attr('id').toLowerCase() == name.toLowerCase();
                });

                if(idAttr.length || nameAttr.length ){
                    showError('error', 'data-anchor tags can not have the same value as any `id` element on the site (or `name` element for IE).');
                    idAttr.length && showError('error', '"' + name + '" is is being used by another element `id` property');
                    nameAttr.length && showError('error', '"' + name + '" is is being used by another element `name` property');
                }
            });
        }

        /**
        * Shows a message in the console of the given type.
        */
        function showError(type, text){
            console && console[type] && console[type]('fullPage: ' + text);
        }
    };

    /**
     * An object to handle overflow scrolling.
     * This uses jquery.slimScroll to accomplish overflow scrolling.
     * It is possible to pass in an alternate scrollOverflowHandler
     * to the fullpage.js option that implements the same functions
     * as this handler.
     *
     * @type {Object}
     */
    var slimScrollHandler = {
        /**
         * Optional function called after each render.
         *
         * Solves a bug with slimScroll vendor library #1037, #553
         *
         * @param  {object} section jQuery object containing rendered section
         */
        afterRender: function(section){
            var slides = section.find(SLIDES_WRAPPER);
            var scrollableWrap = section.find(SCROLLABLE_SEL);

            if(slides.length){
                scrollableWrap = slides.find(SLIDE_ACTIVE_SEL);
            }

            scrollableWrap.mouseover();
        },

        /**
         * Called when overflow scrolling is needed for a section.
         *
         * @param  {Object} element      jQuery object containing current section
         * @param  {Number} scrollHeight Current window height in pixels
         */
        create: function(element, scrollHeight){
            element.find(SCROLLABLE_SEL).slimScroll({
                allowPageScroll: true,
                height: scrollHeight + 'px',
                size: '10px',
                alwaysVisible: true
            });
        },

        /**
         * Return a boolean depending on whether the scrollable element is a
         * the end or at the start of the scrolling depending on the given type.
         *
         * @param  {String}  type       Either 'top' or 'bottom'
         * @param  {Object}  scrollable jQuery object for the scrollable element
         * @return {Boolean}
         */
        isScrolled: function(type, scrollable){
            if(type === 'top'){
                return !scrollable.scrollTop();
            }else if(type === 'bottom'){
                return scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
            }
        },

        /**
         * Returns the scrollable element for the given section.
         * If there are landscape slides, will only return a scrollable element
         * if it is in the active slide.
         *
         * @param  {Object}  activeSection jQuery object containing current section
         * @return {Boolean}
         */
        scrollable: function(activeSection){
            // if there are landscape slides, we check if the scrolling bar is in the current one or not
            if(activeSection.find(SLIDES_WRAPPER_SEL).length){
                return activeSection.find(SLIDE_ACTIVE_SEL).find(SCROLLABLE_SEL);
            }
            return activeSection.find(SCROLLABLE_SEL);
        },

        /**
         * Returns the scroll height of the wrapped content.
         * If this is larger than the window height minus section padding,
         * overflow scrolling is needed.
         *
         * @param  {Object} element jQuery object containing current section
         * @return {Number}
         */
        scrollHeight: function(element){
            return element.find(SCROLLABLE_SEL).get(0).scrollHeight;
        },

        /**
         * Called when overflow scrolling is no longer needed for a section.
         *
         * @param  {Object} element      jQuery object containing current section
         */
        remove: function(element){
            element.find(SCROLLABLE_SEL).children().first().unwrap().unwrap();
            element.find(SLIMSCROLL_BAR_SEL).remove();
            element.find(SLIMSCROLL_RAIL_SEL).remove();
        },

        /**
         * Called when overflow scrolling has already been setup but the
         * window height has potentially changed.
         *
         * @param  {Object} element      jQuery object containing current section
         * @param  {Number} scrollHeight Current window height in pixels
         */
        update: function(element, scrollHeight){
            element.find(SCROLLABLE_SEL).css('height', scrollHeight + 'px').parent().css('height', scrollHeight + 'px');
        },

        /**
         * Called to get any additional elements needed to wrap the section
         * content in order to facilitate overflow scrolling.
         *
         * @return {String|Object} Can be a string containing HTML,
         *                         a DOM element, or jQuery object.
         */
        wrapContent: function(){
            return '<div class="' + SCROLLABLE + '"></div>';
        }
    };

    defaultScrollHandler = slimScrollHandler;

});
;
/*
 * jQuery Easing v1.3.2 - http://gsgd.co.uk/sandbox/jquery/easing/
 * Open source under the BSD License.
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * https://raw.github.com/gdsmith/jquery-easing/master/LICENSE
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
(function($){$.easing['jswing'] = $.easing['swing'];

$.extend( $.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert($.easing.default);
		return $.easing[$.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - $.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return $.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return $.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});})(jQuery);
;
/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery to collapse the navbar on scroll
$(window).scroll(function() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});;
/*! WOW - v1.1.2 - 2015-04-07
* Copyright (c) 2015 Matthieu Aussaguel; Licensed MIT */(function(){var a,b,c,d,e,f=function(a,b){return function(){return a.apply(b,arguments)}},g=[].indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(b in this&&this[b]===a)return b;return-1};b=function(){function a(){}return a.prototype.extend=function(a,b){var c,d;for(c in b)d=b[c],null==a[c]&&(a[c]=d);return a},a.prototype.isMobile=function(a){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(a)},a.prototype.createEvent=function(a,b,c,d){var e;return null==b&&(b=!1),null==c&&(c=!1),null==d&&(d=null),null!=document.createEvent?(e=document.createEvent("CustomEvent"),e.initCustomEvent(a,b,c,d)):null!=document.createEventObject?(e=document.createEventObject(),e.eventType=a):e.eventName=a,e},a.prototype.emitEvent=function(a,b){return null!=a.dispatchEvent?a.dispatchEvent(b):b in(null!=a)?a[b]():"on"+b in(null!=a)?a["on"+b]():void 0},a.prototype.addEvent=function(a,b,c){return null!=a.addEventListener?a.addEventListener(b,c,!1):null!=a.attachEvent?a.attachEvent("on"+b,c):a[b]=c},a.prototype.removeEvent=function(a,b,c){return null!=a.removeEventListener?a.removeEventListener(b,c,!1):null!=a.detachEvent?a.detachEvent("on"+b,c):delete a[b]},a.prototype.innerHeight=function(){return"innerHeight"in window?window.innerHeight:document.documentElement.clientHeight},a}(),c=this.WeakMap||this.MozWeakMap||(c=function(){function a(){this.keys=[],this.values=[]}return a.prototype.get=function(a){var b,c,d,e,f;for(f=this.keys,b=d=0,e=f.length;e>d;b=++d)if(c=f[b],c===a)return this.values[b]},a.prototype.set=function(a,b){var c,d,e,f,g;for(g=this.keys,c=e=0,f=g.length;f>e;c=++e)if(d=g[c],d===a)return void(this.values[c]=b);return this.keys.push(a),this.values.push(b)},a}()),a=this.MutationObserver||this.WebkitMutationObserver||this.MozMutationObserver||(a=function(){function a(){"undefined"!=typeof console&&null!==console&&console.warn("MutationObserver is not supported by your browser."),"undefined"!=typeof console&&null!==console&&console.warn("WOW.js cannot detect dom mutations, please call .sync() after loading new content.")}return a.notSupported=!0,a.prototype.observe=function(){},a}()),d=this.getComputedStyle||function(a){return this.getPropertyValue=function(b){var c;return"float"===b&&(b="styleFloat"),e.test(b)&&b.replace(e,function(a,b){return b.toUpperCase()}),(null!=(c=a.currentStyle)?c[b]:void 0)||null},this},e=/(\-([a-z]){1})/g,this.WOW=function(){function e(a){null==a&&(a={}),this.scrollCallback=f(this.scrollCallback,this),this.scrollHandler=f(this.scrollHandler,this),this.resetAnimation=f(this.resetAnimation,this),this.start=f(this.start,this),this.scrolled=!0,this.config=this.util().extend(a,this.defaults),this.animationNameCache=new c,this.wowEvent=this.util().createEvent(this.config.boxClass)}return e.prototype.defaults={boxClass:"wow",animateClass:"animated",offset:0,mobile:!0,live:!0,callback:null},e.prototype.init=function(){var a;return this.element=window.document.documentElement,"interactive"===(a=document.readyState)||"complete"===a?this.start():this.util().addEvent(document,"DOMContentLoaded",this.start),this.finished=[]},e.prototype.start=function(){var b,c,d,e;if(this.stopped=!1,this.boxes=function(){var a,c,d,e;for(d=this.element.querySelectorAll("."+this.config.boxClass),e=[],a=0,c=d.length;c>a;a++)b=d[a],e.push(b);return e}.call(this),this.all=function(){var a,c,d,e;for(d=this.boxes,e=[],a=0,c=d.length;c>a;a++)b=d[a],e.push(b);return e}.call(this),this.boxes.length)if(this.disabled())this.resetStyle();else for(e=this.boxes,c=0,d=e.length;d>c;c++)b=e[c],this.applyStyle(b,!0);return this.disabled()||(this.util().addEvent(window,"scroll",this.scrollHandler),this.util().addEvent(window,"resize",this.scrollHandler),this.interval=setInterval(this.scrollCallback,50)),this.config.live?new a(function(a){return function(b){var c,d,e,f,g;for(g=[],c=0,d=b.length;d>c;c++)f=b[c],g.push(function(){var a,b,c,d;for(c=f.addedNodes||[],d=[],a=0,b=c.length;b>a;a++)e=c[a],d.push(this.doSync(e));return d}.call(a));return g}}(this)).observe(document.body,{childList:!0,subtree:!0}):void 0},e.prototype.stop=function(){return this.stopped=!0,this.util().removeEvent(window,"scroll",this.scrollHandler),this.util().removeEvent(window,"resize",this.scrollHandler),null!=this.interval?clearInterval(this.interval):void 0},e.prototype.sync=function(){return a.notSupported?this.doSync(this.element):void 0},e.prototype.doSync=function(a){var b,c,d,e,f;if(null==a&&(a=this.element),1===a.nodeType){for(a=a.parentNode||a,e=a.querySelectorAll("."+this.config.boxClass),f=[],c=0,d=e.length;d>c;c++)b=e[c],g.call(this.all,b)<0?(this.boxes.push(b),this.all.push(b),this.stopped||this.disabled()?this.resetStyle():this.applyStyle(b,!0),f.push(this.scrolled=!0)):f.push(void 0);return f}},e.prototype.show=function(a){return this.applyStyle(a),a.className=a.className+" "+this.config.animateClass,null!=this.config.callback&&this.config.callback(a),this.util().emitEvent(a,this.wowEvent),this.util().addEvent(a,"animationend",this.resetAnimation),this.util().addEvent(a,"oanimationend",this.resetAnimation),this.util().addEvent(a,"webkitAnimationEnd",this.resetAnimation),this.util().addEvent(a,"MSAnimationEnd",this.resetAnimation),a},e.prototype.applyStyle=function(a,b){var c,d,e;return d=a.getAttribute("data-wow-duration"),c=a.getAttribute("data-wow-delay"),e=a.getAttribute("data-wow-iteration"),this.animate(function(f){return function(){return f.customStyle(a,b,d,c,e)}}(this))},e.prototype.animate=function(){return"requestAnimationFrame"in window?function(a){return window.requestAnimationFrame(a)}:function(a){return a()}}(),e.prototype.resetStyle=function(){var a,b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.style.visibility="visible");return e},e.prototype.resetAnimation=function(a){var b;return a.type.toLowerCase().indexOf("animationend")>=0?(b=a.target||a.srcElement,b.className=b.className.replace(this.config.animateClass,"").trim()):void 0},e.prototype.customStyle=function(a,b,c,d,e){return b&&this.cacheAnimationName(a),a.style.visibility=b?"hidden":"visible",c&&this.vendorSet(a.style,{animationDuration:c}),d&&this.vendorSet(a.style,{animationDelay:d}),e&&this.vendorSet(a.style,{animationIterationCount:e}),this.vendorSet(a.style,{animationName:b?"none":this.cachedAnimationName(a)}),a},e.prototype.vendors=["moz","webkit"],e.prototype.vendorSet=function(a,b){var c,d,e,f;d=[];for(c in b)e=b[c],a[""+c]=e,d.push(function(){var b,d,g,h;for(g=this.vendors,h=[],b=0,d=g.length;d>b;b++)f=g[b],h.push(a[""+f+c.charAt(0).toUpperCase()+c.substr(1)]=e);return h}.call(this));return d},e.prototype.vendorCSS=function(a,b){var c,e,f,g,h,i;for(h=d(a),g=h.getPropertyCSSValue(b),f=this.vendors,c=0,e=f.length;e>c;c++)i=f[c],g=g||h.getPropertyCSSValue("-"+i+"-"+b);return g},e.prototype.animationName=function(a){var b;try{b=this.vendorCSS(a,"animation-name").cssText}catch(c){b=d(a).getPropertyValue("animation-name")}return"none"===b?"":b},e.prototype.cacheAnimationName=function(a){return this.animationNameCache.set(a,this.animationName(a))},e.prototype.cachedAnimationName=function(a){return this.animationNameCache.get(a)},e.prototype.scrollHandler=function(){return this.scrolled=!0},e.prototype.scrollCallback=function(){var a;return!this.scrolled||(this.scrolled=!1,this.boxes=function(){var b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],a&&(this.isVisible(a)?this.show(a):e.push(a));return e}.call(this),this.boxes.length||this.config.live)?void 0:this.stop()},e.prototype.offsetTop=function(a){for(var b;void 0===a.offsetTop;)a=a.parentNode;for(b=a.offsetTop;a=a.offsetParent;)b+=a.offsetTop;return b},e.prototype.isVisible=function(a){var b,c,d,e,f;return c=a.getAttribute("data-wow-offset")||this.config.offset,f=window.pageYOffset,e=f+Math.min(this.element.clientHeight,this.util().innerHeight())-c,d=this.offsetTop(a),b=d+a.clientHeight,e>=d&&b>=f},e.prototype.util=function(){return null!=this._util?this._util:this._util=new b},e.prototype.disabled=function(){return!this.config.mobile&&this.util().isMobile(navigator.userAgent)},e}()}).call(this);;
// svg-pan-zoom v3.2.6
// https://github.com/ariutta/svg-pan-zoom
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var svgPanZoom = require('./svg-pan-zoom.js');

// UMD module definition
(function(window, document){
  // AMD
  if (typeof define === 'function' && define.amd) {
    define('svg-pan-zoom', function () {
      return svgPanZoom;
    });
  // CMD
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = svgPanZoom;

    // Browser
    // Keep exporting globally as module.exports is available because of browserify
    window.svgPanZoom = svgPanZoom;
  }
})(window, document)

},{"./svg-pan-zoom.js":4}],2:[function(require,module,exports){
var SvgUtils = require('./svg-utilities');

module.exports = {
  enable: function(instance) {
    // Select (and create if necessary) defs
    var defs = instance.svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS(SvgUtils.svgNS, 'defs')
      instance.svg.appendChild(defs)
    }

    // Create style element - AZ changed line 38 cursor:pointer fill to gray and opacity to 1; svgpanzoomcontralbackground from white to black
    var style = document.createElementNS(SvgUtils.svgNS, 'style')
    style.setAttribute('type', 'text/css')
    style.textContent = '.svg-pan-zoom-control { cursor: pointer; fill: gray; fill-opacity: 1; } .svg-pan-zoom-control:hover { fill-opacity: 0.8; } .svg-pan-zoom-control-background { fill: black; fill-opacity: 0.5; } .svg-pan-zoom-control-background { fill-opacity: 0.8; }'
    defs.appendChild(style)


    // Zoom Group - AZ changed instance width from 70 to 60, instance height from 76 to 65 and scale from .75 to .65
    var zoomGroup = document.createElementNS(SvgUtils.svgNS, 'g');
    zoomGroup.setAttribute('id', 'svg-pan-zoom-controls');
    zoomGroup.setAttribute('transform', 'translate(' + ( instance.width - 60 ) + ' ' + ( instance.height - 65 ) + ') scale(0.65)');
    zoomGroup.setAttribute('class', 'svg-pan-zoom-control');

    // Control elements
    zoomGroup.appendChild(this._createZoomIn(instance))
    zoomGroup.appendChild(this._createZoomReset(instance))
    zoomGroup.appendChild(this._createZoomOut(instance))

    // Finally append created element
    instance.svg.appendChild(zoomGroup)

    // Cache control instance
    instance.controlIcons = zoomGroup
  }

, _createZoomIn: function(instance) {
    var zoomIn = document.createElementNS(SvgUtils.svgNS, 'g');
    zoomIn.setAttribute('id', 'svg-pan-zoom-zoom-in');
    zoomIn.setAttribute('transform', 'translate(30.5 5) scale(0.015)');
    zoomIn.setAttribute('class', 'svg-pan-zoom-control');
    zoomIn.addEventListener('click', function() {instance.getPublicInstance().zoomIn()}, false)
    zoomIn.addEventListener('touchstart', function() {instance.getPublicInstance().zoomIn()}, false)

    var zoomInBackground = document.createElementNS(SvgUtils.svgNS, 'rect'); // TODO change these background space fillers to rounded rectangles so they look prettier
    zoomInBackground.setAttribute('x', '0');
    zoomInBackground.setAttribute('y', '0');
    zoomInBackground.setAttribute('width', '1500'); // larger than expected because the whole group is transformed to scale down
    zoomInBackground.setAttribute('height', '1400');
    zoomInBackground.setAttribute('class', 'svg-pan-zoom-control-background');
    zoomIn.appendChild(zoomInBackground);

    var zoomInShape = document.createElementNS(SvgUtils.svgNS, 'path');
    zoomInShape.setAttribute('d', 'M1280 576v128q0 26 -19 45t-45 19h-320v320q0 26 -19 45t-45 19h-128q-26 0 -45 -19t-19 -45v-320h-320q-26 0 -45 -19t-19 -45v-128q0 -26 19 -45t45 -19h320v-320q0 -26 19 -45t45 -19h128q26 0 45 19t19 45v320h320q26 0 45 19t19 45zM1536 1120v-960 q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5t84.5 -203.5z');
    zoomInShape.setAttribute('class', 'svg-pan-zoom-control-element');
    zoomIn.appendChild(zoomInShape);

    return zoomIn
  }

, _createZoomReset: function(instance){
    // reset
    var resetPanZoomControl = document.createElementNS(SvgUtils.svgNS, 'g');
    resetPanZoomControl.setAttribute('id', 'svg-pan-zoom-reset-pan-zoom');
    resetPanZoomControl.setAttribute('transform', 'translate(5 35) scale(0.4)');
    resetPanZoomControl.setAttribute('class', 'svg-pan-zoom-control');
    resetPanZoomControl.addEventListener('click', function() {instance.getPublicInstance().reset()}, false);
    resetPanZoomControl.addEventListener('touchstart', function() {instance.getPublicInstance().reset()}, false);

    var resetPanZoomControlBackground = document.createElementNS(SvgUtils.svgNS, 'rect'); // TODO change these background space fillers to rounded rectangles so they look prettier
    resetPanZoomControlBackground.setAttribute('x', '2');
    resetPanZoomControlBackground.setAttribute('y', '2');
    resetPanZoomControlBackground.setAttribute('width', '182'); // larger than expected because the whole group is transformed to scale down
    resetPanZoomControlBackground.setAttribute('height', '58');
    resetPanZoomControlBackground.setAttribute('class', 'svg-pan-zoom-control-background');
    resetPanZoomControl.appendChild(resetPanZoomControlBackground);

    var resetPanZoomControlShape1 = document.createElementNS(SvgUtils.svgNS, 'path');
    resetPanZoomControlShape1.setAttribute('d', 'M33.051,20.632c-0.742-0.406-1.854-0.609-3.338-0.609h-7.969v9.281h7.769c1.543,0,2.701-0.188,3.473-0.562c1.365-0.656,2.048-1.953,2.048-3.891C35.032,22.757,34.372,21.351,33.051,20.632z');
    resetPanZoomControlShape1.setAttribute('class', 'svg-pan-zoom-control-element');
    resetPanZoomControl.appendChild(resetPanZoomControlShape1);

    var resetPanZoomControlShape2 = document.createElementNS(SvgUtils.svgNS, 'path');
    resetPanZoomControlShape2.setAttribute('d', 'M170.231,0.5H15.847C7.102,0.5,0.5,5.708,0.5,11.84v38.861C0.5,56.833,7.102,61.5,15.847,61.5h154.384c8.745,0,15.269-4.667,15.269-10.798V11.84C185.5,5.708,178.976,0.5,170.231,0.5z M42.837,48.569h-7.969c-0.219-0.766-0.375-1.383-0.469-1.852c-0.188-0.969-0.289-1.961-0.305-2.977l-0.047-3.211c-0.03-2.203-0.41-3.672-1.142-4.406c-0.732-0.734-2.103-1.102-4.113-1.102h-7.05v13.547h-7.055V14.022h16.524c2.361,0.047,4.178,0.344,5.45,0.891c1.272,0.547,2.351,1.352,3.234,2.414c0.731,0.875,1.31,1.844,1.737,2.906s0.64,2.273,0.64,3.633c0,1.641-0.414,3.254-1.242,4.84s-2.195,2.707-4.102,3.363c1.594,0.641,2.723,1.551,3.387,2.73s0.996,2.98,0.996,5.402v2.32c0,1.578,0.063,2.648,0.19,3.211c0.19,0.891,0.635,1.547,1.333,1.969V48.569z M75.579,48.569h-26.18V14.022h25.336v6.117H56.454v7.336h16.781v6H56.454v8.883h19.125V48.569z M104.497,46.331c-2.44,2.086-5.887,3.129-10.34,3.129c-4.548,0-8.125-1.027-10.731-3.082s-3.909-4.879-3.909-8.473h6.891c0.224,1.578,0.662,2.758,1.316,3.539c1.196,1.422,3.246,2.133,6.15,2.133c1.739,0,3.151-0.188,4.236-0.562c2.058-0.719,3.087-2.055,3.087-4.008c0-1.141-0.504-2.023-1.512-2.648c-1.008-0.609-2.607-1.148-4.796-1.617l-3.74-0.82c-3.676-0.812-6.201-1.695-7.576-2.648c-2.328-1.594-3.492-4.086-3.492-7.477c0-3.094,1.139-5.664,3.417-7.711s5.623-3.07,10.036-3.07c3.685,0,6.829,0.965,9.431,2.895c2.602,1.93,3.966,4.73,4.093,8.402h-6.938c-0.128-2.078-1.057-3.555-2.787-4.43c-1.154-0.578-2.587-0.867-4.301-0.867c-1.907,0-3.428,0.375-4.565,1.125c-1.138,0.75-1.706,1.797-1.706,3.141c0,1.234,0.561,2.156,1.682,2.766c0.721,0.406,2.25,0.883,4.589,1.43l6.063,1.43c2.657,0.625,4.648,1.461,5.975,2.508c2.059,1.625,3.089,3.977,3.089,7.055C108.157,41.624,106.937,44.245,104.497,46.331z M139.61,48.569h-26.18V14.022h25.336v6.117h-18.281v7.336h16.781v6h-16.781v8.883h19.125V48.569z M170.337,20.14h-10.336v28.43h-7.266V20.14h-10.383v-6.117h27.984V20.14z');
    resetPanZoomControlShape2.setAttribute('class', 'svg-pan-zoom-control-element');
    resetPanZoomControl.appendChild(resetPanZoomControlShape2);

    return resetPanZoomControl
  }

, _createZoomOut: function(instance){
    // zoom out
    var zoomOut = document.createElementNS(SvgUtils.svgNS, 'g');
    zoomOut.setAttribute('id', 'svg-pan-zoom-zoom-out');
    zoomOut.setAttribute('transform', 'translate(30.5 70) scale(0.015)');
    zoomOut.setAttribute('class', 'svg-pan-zoom-control');
    zoomOut.addEventListener('click', function() {instance.getPublicInstance().zoomOut()}, false);
    zoomOut.addEventListener('touchstart', function() {instance.getPublicInstance().zoomOut()}, false);

    var zoomOutBackground = document.createElementNS(SvgUtils.svgNS, 'rect'); // TODO change these background space fillers to rounded rectangles so they look prettier
    zoomOutBackground.setAttribute('x', '0');
    zoomOutBackground.setAttribute('y', '0');
    zoomOutBackground.setAttribute('width', '1500'); // larger than expected because the whole group is transformed to scale down
    zoomOutBackground.setAttribute('height', '1400');
    zoomOutBackground.setAttribute('class', 'svg-pan-zoom-control-background');
    zoomOut.appendChild(zoomOutBackground);

    var zoomOutShape = document.createElementNS(SvgUtils.svgNS, 'path');
    zoomOutShape.setAttribute('d', 'M1280 576v128q0 26 -19 45t-45 19h-896q-26 0 -45 -19t-19 -45v-128q0 -26 19 -45t45 -19h896q26 0 45 19t19 45zM1536 1120v-960q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5 t84.5 -203.5z');
    zoomOutShape.setAttribute('class', 'svg-pan-zoom-control-element');
    zoomOut.appendChild(zoomOutShape);

    return zoomOut
  }

, disable: function(instance) {
    if (instance.controlIcons) {
      instance.controlIcons.parentNode.removeChild(instance.controlIcons)
      instance.controlIcons = null
    }
  }
}

},{"./svg-utilities":5}],3:[function(require,module,exports){
var SvgUtils = require('./svg-utilities')
  , Utils = require('./utilities')
  ;

var ShadowViewport = function(viewport, options){
  this.init(viewport, options)
}

/**
 * Initialization
 *
 * @param  {SVGElement} viewport
 * @param  {Object} options
 */
ShadowViewport.prototype.init = function(viewport, options) {
  // DOM Elements
  this.viewport = viewport
  this.options = options

  // State cache
  this.originalState = {zoom: 1, x: 0, y: 0}
  this.activeState = {zoom: 1, x: 0, y: 0}

  this.updateCTMCached = Utils.proxy(this.updateCTM, this)

  // Create a custom requestAnimationFrame taking in account refreshRate
  this.requestAnimationFrame = Utils.createRequestAnimationFrame(this.options.refreshRate)

  // ViewBox
  this.viewBox = {x: 0, y: 0, width: 0, height: 0}
  this.cacheViewBox()

  // Process CTM
  this.processCTM()

  // Update CTM in this frame
  this.updateCTM()
}

/**
 * Cache initial viewBox value
 * If no viewBox is defined, then use viewport size/position instead for viewBox values
 */
ShadowViewport.prototype.cacheViewBox = function() {
  var svgViewBox = this.options.svg.getAttribute('viewBox')

  if (svgViewBox) {
    var viewBoxValues = svgViewBox.split(/[\s\,]/).filter(function(v){return v}).map(parseFloat)

    // Cache viewbox x and y offset
    this.viewBox.x = viewBoxValues[0]
    this.viewBox.y = viewBoxValues[1]
    this.viewBox.width = viewBoxValues[2]
    this.viewBox.height = viewBoxValues[3]

    var zoom = Math.min(this.options.width / this.viewBox.width, this.options.height / this.viewBox.height)

    // Update active state
    this.activeState.zoom = zoom
    this.activeState.x = (this.options.width - this.viewBox.width * zoom) / 2
    this.activeState.y = (this.options.height - this.viewBox.height * zoom) / 2

    // Force updating CTM
    this.updateCTMOnNextFrame()

    this.options.svg.removeAttribute('viewBox')
  } else {
    var bBox = this.viewport.getBBox();

    // Cache viewbox sizes
    this.viewBox.x = bBox.x;
    this.viewBox.y = bBox.y;
    this.viewBox.width = bBox.width
    this.viewBox.height = bBox.height
  }
}

/**
 * Recalculate viewport sizes and update viewBox cache
 */
ShadowViewport.prototype.recacheViewBox = function() {
  var boundingClientRect = this.viewport.getBoundingClientRect()
    , viewBoxWidth = boundingClientRect.width / this.getZoom()
    , viewBoxHeight = boundingClientRect.height / this.getZoom()

  // Cache viewbox
  this.viewBox.x = 0
  this.viewBox.y = 0
  this.viewBox.width = viewBoxWidth
  this.viewBox.height = viewBoxHeight
}

/**
 * Returns a viewbox object. Safe to alter
 *
 * @return {Object} viewbox object
 */
ShadowViewport.prototype.getViewBox = function() {
  return Utils.extend({}, this.viewBox)
}

/**
 * Get initial zoom and pan values. Save them into originalState
 * Parses viewBox attribute to alter initial sizes
 */
ShadowViewport.prototype.processCTM = function() {
  var newCTM = this.getCTM()

  if (this.options.fit || this.options.contain) {
    var newScale;
    if (this.options.fit) {
      newScale = Math.min(this.options.width/this.viewBox.width, this.options.height/this.viewBox.height);
    } else {
      newScale = Math.max(this.options.width/this.viewBox.width, this.options.height/this.viewBox.height);
    }

    newCTM.a = newScale; //x-scale
    newCTM.d = newScale; //y-scale
    newCTM.e = -this.viewBox.x * newScale; //x-transform
    newCTM.f = -this.viewBox.y * newScale; //y-transform
  }

  if (this.options.center) {
    var offsetX = (this.options.width - (this.viewBox.width + this.viewBox.x * 2) * newCTM.a) * 0.5
      , offsetY = (this.options.height - (this.viewBox.height + this.viewBox.y * 2) * newCTM.a) * 0.5

    newCTM.e = offsetX
    newCTM.f = offsetY
  }

  // Cache initial values. Based on activeState and fix+center opitons
  this.originalState.zoom = newCTM.a
  this.originalState.x = newCTM.e
  this.originalState.y = newCTM.f

  // Update viewport CTM and cache zoom and pan
  this.setCTM(newCTM);
}

/**
 * Return originalState object. Safe to alter
 *
 * @return {Object}
 */
ShadowViewport.prototype.getOriginalState = function() {
  return Utils.extend({}, this.originalState)
}

/**
 * Return actualState object. Safe to alter
 *
 * @return {Object}
 */
ShadowViewport.prototype.getState = function() {
  return Utils.extend({}, this.activeState)
}

/**
 * Get zoom scale
 *
 * @return {Float} zoom scale
 */
ShadowViewport.prototype.getZoom = function() {
  return this.activeState.zoom
}

/**
 * Get zoom scale for pubilc usage
 *
 * @return {Float} zoom scale
 */
ShadowViewport.prototype.getRelativeZoom = function() {
  return this.activeState.zoom / this.originalState.zoom
}

/**
 * Compute zoom scale for pubilc usage
 *
 * @return {Float} zoom scale
 */
ShadowViewport.prototype.computeRelativeZoom = function(scale) {
  return scale / this.originalState.zoom
}

/**
 * Get pan
 *
 * @return {Object}
 */
ShadowViewport.prototype.getPan = function() {
  return {x: this.activeState.x, y: this.activeState.y}
}

/**
 * Return cached viewport CTM value that can be safely modified
 *
 * @return {SVGMatrix}
 */
ShadowViewport.prototype.getCTM = function() {
  var safeCTM = this.options.svg.createSVGMatrix()

  // Copy values manually as in FF they are not itterable
  safeCTM.a = this.activeState.zoom
  safeCTM.b = 0
  safeCTM.c = 0
  safeCTM.d = this.activeState.zoom
  safeCTM.e = this.activeState.x
  safeCTM.f = this.activeState.y

  return safeCTM
}

/**
 * Set a new CTM
 *
 * @param {SVGMatrix} newCTM
 */
ShadowViewport.prototype.setCTM = function(newCTM) {
  var willZoom = this.isZoomDifferent(newCTM)
    , willPan = this.isPanDifferent(newCTM)

  if (willZoom || willPan) {
    // Before zoom
    if (willZoom) {
      // If returns false then cancel zooming
      if (this.options.beforeZoom(this.getRelativeZoom(), this.computeRelativeZoom(newCTM.a)) === false) {
        newCTM.a = newCTM.d = this.activeState.zoom
        willZoom = false
      }
    }

    // Before pan
    if (willPan) {
      var preventPan = this.options.beforePan(this.getPan(), {x: newCTM.e, y: newCTM.f})
          // If prevent pan is an object
        , preventPanX = false
        , preventPanY = false

      // If prevent pan is Boolean false
      if (preventPan === false) {
        // Set x and y same as before
        newCTM.e = this.getPan().x
        newCTM.f = this.getPan().y

        preventPanX = preventPanY = true
      } else if (Utils.isObject(preventPan)) {
        // Check for X axes attribute
        if (preventPan.x === false) {
          // Prevent panning on x axes
          newCTM.e = this.getPan().x
          preventPanX = true
        } else if (Utils.isNumber(preventPan.x)) {
          // Set a custom pan value
          newCTM.e = preventPan.x
        }

        // Check for Y axes attribute
        if (preventPan.y === false) {
          // Prevent panning on x axes
          newCTM.f = this.getPan().y
          preventPanY = true
        } else if (Utils.isNumber(preventPan.y)) {
          // Set a custom pan value
          newCTM.f = preventPan.y
        }
      }

      // Update willPan flag
      if (preventPanX && preventPanY) {
        willPan = false
      }
    }

    // Check again if should zoom or pan
    if (willZoom || willPan) {
      this.updateCache(newCTM)

      this.updateCTMOnNextFrame()

      // After callbacks
      if (willZoom) {this.options.onZoom(this.getRelativeZoom())}
      if (willPan) {this.options.onPan(this.getPan())}
    }
  }
}

ShadowViewport.prototype.isZoomDifferent = function(newCTM) {
  return this.activeState.zoom !== newCTM.a
}

ShadowViewport.prototype.isPanDifferent = function(newCTM) {
  return this.activeState.x !== newCTM.e || this.activeState.y !== newCTM.f
}


/**
 * Update cached CTM and active state
 *
 * @param {SVGMatrix} newCTM
 */
ShadowViewport.prototype.updateCache = function(newCTM) {
  this.activeState.zoom = newCTM.a
  this.activeState.x = newCTM.e
  this.activeState.y = newCTM.f
}

ShadowViewport.prototype.pendingUpdate = false

/**
 * Place a request to update CTM on next Frame
 */
ShadowViewport.prototype.updateCTMOnNextFrame = function() {
  if (!this.pendingUpdate) {
    // Lock
    this.pendingUpdate = true

    // Throttle next update
    this.requestAnimationFrame.call(window, this.updateCTMCached)
  }
}

/**
 * Update viewport CTM with cached CTM
 */
ShadowViewport.prototype.updateCTM = function() {
  // Updates SVG element
  SvgUtils.setCTM(this.viewport, this.getCTM(), this.defs)

  // Free the lock
  this.pendingUpdate = false
}

module.exports = function(viewport, options){
  return new ShadowViewport(viewport, options)
}

},{"./svg-utilities":5,"./utilities":7}],4:[function(require,module,exports){
var Wheel = require('./uniwheel')
, ControlIcons = require('./control-icons')
, Utils = require('./utilities')
, SvgUtils = require('./svg-utilities')
, ShadowViewport = require('./shadow-viewport')

var SvgPanZoom = function(svg, options) {
  this.init(svg, options)
}

var optionsDefaults = {
  viewportSelector: '.svg-pan-zoom_viewport' // Viewport selector. Can be querySelector string or SVGElement
, panEnabled: true // enable or disable panning (default enabled)
, controlIconsEnabled: false // insert icons to give user an option in addition to mouse events to control pan/zoom (default disabled)
, zoomEnabled: true // enable or disable zooming (default enabled)
, dblClickZoomEnabled: true // enable or disable zooming by double clicking (default enabled)
, mouseWheelZoomEnabled: true // enable or disable zooming by mouse wheel (default enabled)
, preventMouseEventsDefault: true // enable or disable preventDefault for mouse events
, zoomScaleSensitivity: 0.1 // Zoom sensitivity
, minZoom: 0.5 // Minimum Zoom level
, maxZoom: 10 // Maximum Zoom level
, fit: true // enable or disable viewport fit in SVG (default true)
, contain: false // enable or disable viewport contain the svg (default false)
, center: true // enable or disable viewport centering in SVG (default true)
, refreshRate: 'auto' // Maximum number of frames per second (altering SVG's viewport)
, beforeZoom: null
, onZoom: null
, beforePan: null
, onPan: null
, customEventsHandler: null
, eventsListenerElement: null
}

SvgPanZoom.prototype.init = function(svg, options) {
  var that = this

  this.svg = svg
  this.defs = svg.querySelector('defs')

  // Add default attributes to SVG
  SvgUtils.setupSvgAttributes(this.svg)

  // Set options
  this.options = Utils.extend(Utils.extend({}, optionsDefaults), options)

  // Set default state
  this.state = 'none'

  // Get dimensions
  var boundingClientRectNormalized = SvgUtils.getBoundingClientRectNormalized(svg)
  this.width = boundingClientRectNormalized.width
  this.height = boundingClientRectNormalized.height

  // Init shadow viewport
  this.viewport = ShadowViewport(SvgUtils.getOrCreateViewport(this.svg, this.options.viewportSelector), {
    svg: this.svg
  , width: this.width
  , height: this.height
  , fit: this.options.fit
  , contain: this.options.contain
  , center: this.options.center
  , refreshRate: this.options.refreshRate
  // Put callbacks into functions as they can change through time
  , beforeZoom: function(oldScale, newScale) {
      if (that.viewport && that.options.beforeZoom) {return that.options.beforeZoom(oldScale, newScale)}
    }
  , onZoom: function(scale) {
      if (that.viewport && that.options.onZoom) {return that.options.onZoom(scale)}
    }
  , beforePan: function(oldPoint, newPoint) {
      if (that.viewport && that.options.beforePan) {return that.options.beforePan(oldPoint, newPoint)}
    }
  , onPan: function(point) {
      if (that.viewport && that.options.onPan) {return that.options.onPan(point)}
    }
  })

  // Wrap callbacks into public API context
  var publicInstance = this.getPublicInstance()
  publicInstance.setBeforeZoom(this.options.beforeZoom)
  publicInstance.setOnZoom(this.options.onZoom)
  publicInstance.setBeforePan(this.options.beforePan)
  publicInstance.setOnPan(this.options.onPan)

  if (this.options.controlIconsEnabled) {
    ControlIcons.enable(this)
  }

  // Init events handlers
  this.lastMouseWheelEventTime = Date.now()
  this.setupHandlers()
}

/**
 * Register event handlers
 */
SvgPanZoom.prototype.setupHandlers = function() {
  var that = this
    , prevEvt = null // use for touchstart event to detect double tap
    ;

  this.eventListeners = {
    // Mouse down group
    mousedown: function(evt) {
      return that.handleMouseDown(evt, null);
    }
  , touchstart: function(evt) {
      var result = that.handleMouseDown(evt, prevEvt);
      prevEvt = evt
      return result;
    }

    // Mouse up group
  , mouseup: function(evt) {
      return that.handleMouseUp(evt);
    }
  , touchend: function(evt) {
      return that.handleMouseUp(evt);
    }

    // Mouse move group
  , mousemove: function(evt) {
      return that.handleMouseMove(evt);
    }
  , touchmove: function(evt) {
      return that.handleMouseMove(evt);
    }

    // Mouse leave group
  , mouseleave: function(evt) {
      return that.handleMouseUp(evt);
    }
  , touchleave: function(evt) {
      return that.handleMouseUp(evt);
    }
  , touchcancel: function(evt) {
      return that.handleMouseUp(evt);
    }
  }

  // Init custom events handler if available
  if (this.options.customEventsHandler != null) { // jshint ignore:line
    this.options.customEventsHandler.init({
      svgElement: this.svg
    , eventsListenerElement: this.options.eventsListenerElement
    , instance: this.getPublicInstance()
    })

    // Custom event handler may halt builtin listeners
    var haltEventListeners = this.options.customEventsHandler.haltEventListeners
    if (haltEventListeners && haltEventListeners.length) {
      for (var i = haltEventListeners.length - 1; i >= 0; i--) {
        if (this.eventListeners.hasOwnProperty(haltEventListeners[i])) {
          delete this.eventListeners[haltEventListeners[i]]
        }
      }
    }
  }

  // Bind eventListeners
  for (var event in this.eventListeners) {
    // Attach event to eventsListenerElement or SVG if not available
    (this.options.eventsListenerElement || this.svg)
      .addEventListener(event, this.eventListeners[event], false)
  }

  // Zoom using mouse wheel
  if (this.options.mouseWheelZoomEnabled) {
    this.options.mouseWheelZoomEnabled = false // set to false as enable will set it back to true
    this.enableMouseWheelZoom()
  }
}

/**
 * Enable ability to zoom using mouse wheel
 */
SvgPanZoom.prototype.enableMouseWheelZoom = function() {
  if (!this.options.mouseWheelZoomEnabled) {
    var that = this

    // Mouse wheel listener
    this.wheelListener = function(evt) {
      return that.handleMouseWheel(evt);
    }

    // Bind wheelListener
    Wheel.on(this.options.eventsListenerElement || this.svg, this.wheelListener, false)

    this.options.mouseWheelZoomEnabled = true
  }
}

/**
 * Disable ability to zoom using mouse wheel
 */
SvgPanZoom.prototype.disableMouseWheelZoom = function() {
  if (this.options.mouseWheelZoomEnabled) {
    Wheel.off(this.options.eventsListenerElement || this.svg, this.wheelListener, false)
    this.options.mouseWheelZoomEnabled = false
  }
}

/**
 * Handle mouse wheel event
 *
 * @param  {Event} evt
 */
SvgPanZoom.prototype.handleMouseWheel = function(evt) {
  if (!this.options.zoomEnabled || this.state !== 'none') {
    return;
  }

  if (this.options.preventMouseEventsDefault){
    if (evt.preventDefault) {
      evt.preventDefault();
    } else {
      evt.returnValue = false;
    }
  }

  // Default delta in case that deltaY is not available
  var delta = evt.deltaY || 1
    , timeDelta = Date.now() - this.lastMouseWheelEventTime
    , divider = 3 + Math.max(0, 30 - timeDelta)

  // Update cache
  this.lastMouseWheelEventTime = Date.now()

  // Make empirical adjustments for browsers that give deltaY in pixels (deltaMode=0)
  if ('deltaMode' in evt && evt.deltaMode === 0 && evt.wheelDelta) {
    delta = evt.deltaY === 0 ? 0 :  Math.abs(evt.wheelDelta) / evt.deltaY
  }

  delta = -0.3 < delta && delta < 0.3 ? delta : (delta > 0 ? 1 : -1) * Math.log(Math.abs(delta) + 10) / divider

  var inversedScreenCTM = this.svg.getScreenCTM().inverse()
    , relativeMousePoint = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(inversedScreenCTM)
    , zoom = Math.pow(1 + this.options.zoomScaleSensitivity, (-1) * delta); // multiplying by neg. 1 so as to make zoom in/out behavior match Google maps behavior

  this.zoomAtPoint(zoom, relativeMousePoint)
}

/**
 * Zoom in at a SVG point
 *
 * @param  {SVGPoint} point
 * @param  {Float} zoomScale    Number representing how much to zoom
 * @param  {Boolean} zoomAbsolute Default false. If true, zoomScale is treated as an absolute value.
 *                                Otherwise, zoomScale is treated as a multiplied (e.g. 1.10 would zoom in 10%)
 */
SvgPanZoom.prototype.zoomAtPoint = function(zoomScale, point, zoomAbsolute) {
  var originalState = this.viewport.getOriginalState()

  if (!zoomAbsolute) {
    // Fit zoomScale in set bounds
    if (this.getZoom() * zoomScale < this.options.minZoom * originalState.zoom) {
      zoomScale = (this.options.minZoom * originalState.zoom) / this.getZoom()
    } else if (this.getZoom() * zoomScale > this.options.maxZoom * originalState.zoom) {
      zoomScale = (this.options.maxZoom * originalState.zoom) / this.getZoom()
    }
  } else {
    // Fit zoomScale in set bounds
    zoomScale = Math.max(this.options.minZoom * originalState.zoom, Math.min(this.options.maxZoom * originalState.zoom, zoomScale))
    // Find relative scale to achieve desired scale
    zoomScale = zoomScale/this.getZoom()
  }

  var oldCTM = this.viewport.getCTM()
    , relativePoint = point.matrixTransform(oldCTM.inverse())
    , modifier = this.svg.createSVGMatrix().translate(relativePoint.x, relativePoint.y).scale(zoomScale).translate(-relativePoint.x, -relativePoint.y)
    , newCTM = oldCTM.multiply(modifier)

  if (newCTM.a !== oldCTM.a) {
    this.viewport.setCTM(newCTM)
  }
}

/**
 * Zoom at center point
 *
 * @param  {Float} scale
 * @param  {Boolean} absolute Marks zoom scale as relative or absolute
 */
SvgPanZoom.prototype.zoom = function(scale, absolute) {
  this.zoomAtPoint(scale, SvgUtils.getSvgCenterPoint(this.svg, this.width, this.height), absolute)
}

/**
 * Zoom used by public instance
 *
 * @param  {Float} scale
 * @param  {Boolean} absolute Marks zoom scale as relative or absolute
 */
SvgPanZoom.prototype.publicZoom = function(scale, absolute) {
  if (absolute) {
    scale = this.computeFromRelativeZoom(scale)
  }

  this.zoom(scale, absolute)
}

/**
 * Zoom at point used by public instance
 *
 * @param  {Float} scale
 * @param  {SVGPoint|Object} point    An object that has x and y attributes
 * @param  {Boolean} absolute Marks zoom scale as relative or absolute
 */
SvgPanZoom.prototype.publicZoomAtPoint = function(scale, point, absolute) {
  if (absolute) {
    // Transform zoom into a relative value
    scale = this.computeFromRelativeZoom(scale)
  }

  // If not a SVGPoint but has x and y then create a SVGPoint
  if (Utils.getType(point) !== 'SVGPoint') {
    if('x' in point && 'y' in point) {
      point = SvgUtils.createSVGPoint(this.svg, point.x, point.y)
    } else {
      throw new Error('Given point is invalid')
    }
  }

  this.zoomAtPoint(scale, point, absolute)
}

/**
 * Get zoom scale
 *
 * @return {Float} zoom scale
 */
SvgPanZoom.prototype.getZoom = function() {
  return this.viewport.getZoom()
}

/**
 * Get zoom scale for public usage
 *
 * @return {Float} zoom scale
 */
SvgPanZoom.prototype.getRelativeZoom = function() {
  return this.viewport.getRelativeZoom()
}

/**
 * Compute actual zoom from public zoom
 *
 * @param  {Float} zoom
 * @return {Float} zoom scale
 */
SvgPanZoom.prototype.computeFromRelativeZoom = function(zoom) {
  return zoom * this.viewport.getOriginalState().zoom
}

/**
 * Set zoom to initial state
 */
SvgPanZoom.prototype.resetZoom = function() {
  var originalState = this.viewport.getOriginalState()

  this.zoom(originalState.zoom, true);
}

/**
 * Set pan to initial state
 */
SvgPanZoom.prototype.resetPan = function() {
  this.pan(this.viewport.getOriginalState());
}

/**
 * Set pan and zoom to initial state
 */
SvgPanZoom.prototype.reset = function() {
  this.resetZoom()
  this.resetPan()
}

/**
 * Handle double click event
 * See handleMouseDown() for alternate detection method
 *
 * @param {Event} evt
 */
SvgPanZoom.prototype.handleDblClick = function(evt) {
  if (this.options.preventMouseEventsDefault) {
    if (evt.preventDefault) {
      evt.preventDefault()
    } else {
      evt.returnValue = false
    }
  }

  // Check if target was a control button
  if (this.options.controlIconsEnabled) {
    var targetClass = evt.target.getAttribute('class') || ''
    if (targetClass.indexOf('svg-pan-zoom-control') > -1) {
      return false
    }
  }

  var zoomFactor

  if (evt.shiftKey) {
    zoomFactor = 1/((1 + this.options.zoomScaleSensitivity) * 2) // zoom out when shift key pressed
  } else {
    zoomFactor = (1 + this.options.zoomScaleSensitivity) * 2
  }

  var point = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(this.svg.getScreenCTM().inverse())
  this.zoomAtPoint(zoomFactor, point)
}

/**
 * Handle click event
 *
 * @param {Event} evt
 */
SvgPanZoom.prototype.handleMouseDown = function(evt, prevEvt) {
  if (this.options.preventMouseEventsDefault) {
    if (evt.preventDefault) {
      evt.preventDefault()
    } else {
      evt.returnValue = false
    }
  }

  Utils.mouseAndTouchNormalize(evt, this.svg)

  // Double click detection; more consistent than ondblclick
  if (this.options.dblClickZoomEnabled && Utils.isDblClick(evt, prevEvt)){
    this.handleDblClick(evt)
  } else {
    // Pan mode
    this.state = 'pan'
    this.firstEventCTM = this.viewport.getCTM()
    this.stateOrigin = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(this.firstEventCTM.inverse())
  }
}

/**
 * Handle mouse move event
 *
 * @param  {Event} evt
 */
SvgPanZoom.prototype.handleMouseMove = function(evt) {
  if (this.options.preventMouseEventsDefault) {
    if (evt.preventDefault) {
      evt.preventDefault()
    } else {
      evt.returnValue = false
    }
  }

  if (this.state === 'pan' && this.options.panEnabled) {
    // Pan mode
    var point = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(this.firstEventCTM.inverse())
      , viewportCTM = this.firstEventCTM.translate(point.x - this.stateOrigin.x, point.y - this.stateOrigin.y)

    this.viewport.setCTM(viewportCTM)
  }
}

/**
 * Handle mouse button release event
 *
 * @param {Event} evt
 */
SvgPanZoom.prototype.handleMouseUp = function(evt) {
  if (this.options.preventMouseEventsDefault) {
    if (evt.preventDefault) {
      evt.preventDefault()
    } else {
      evt.returnValue = false
    }
  }

  if (this.state === 'pan') {
    // Quit pan mode
    this.state = 'none'
  }
}

/**
 * Adjust viewport size (only) so it will fit in SVG
 * Does not center image
 */
SvgPanZoom.prototype.fit = function() {
  var viewBox = this.viewport.getViewBox()
    , newScale = Math.min(this.width/viewBox.width, this.height/viewBox.height)

  this.zoom(newScale, true)
}

/**
 * Adjust viewport size (only) so it will contain the SVG
 * Does not center image
 */
SvgPanZoom.prototype.contain = function() {
  var viewBox = this.viewport.getViewBox()
    , newScale = Math.max(this.width/viewBox.width, this.height/viewBox.height)

  this.zoom(newScale, true)
}

/**
 * Adjust viewport pan (only) so it will be centered in SVG
 * Does not zoom/fit/contain image
 */
SvgPanZoom.prototype.center = function() {
  var viewBox = this.viewport.getViewBox()
    , offsetX = (this.width - (viewBox.width + viewBox.x * 2) * this.getZoom()) * 0.5
    , offsetY = (this.height - (viewBox.height + viewBox.y * 2) * this.getZoom()) * 0.5

  this.getPublicInstance().pan({x: offsetX, y: offsetY})
}

/**
 * Update content cached BorderBox
 * Use when viewport contents change
 */
SvgPanZoom.prototype.updateBBox = function() {
  this.viewport.recacheViewBox()
}

/**
 * Pan to a rendered position
 *
 * @param  {Object} point {x: 0, y: 0}
 */
SvgPanZoom.prototype.pan = function(point) {
  var viewportCTM = this.viewport.getCTM()
  viewportCTM.e = point.x
  viewportCTM.f = point.y
  this.viewport.setCTM(viewportCTM)
}

/**
 * Relatively pan the graph by a specified rendered position vector
 *
 * @param  {Object} point {x: 0, y: 0}
 */
SvgPanZoom.prototype.panBy = function(point) {
  var viewportCTM = this.viewport.getCTM()
  viewportCTM.e += point.x
  viewportCTM.f += point.y
  this.viewport.setCTM(viewportCTM)
}

/**
 * Get pan vector
 *
 * @return {Object} {x: 0, y: 0}
 */
SvgPanZoom.prototype.getPan = function() {
  var state = this.viewport.getState()

  return {x: state.x, y: state.y}
}

/**
 * Recalculates cached svg dimensions and controls position
 */
SvgPanZoom.prototype.resize = function() {
  // Get dimensions
  var boundingClientRectNormalized = SvgUtils.getBoundingClientRectNormalized(this.svg)
  this.width = boundingClientRectNormalized.width
  this.height = boundingClientRectNormalized.height

  // Reposition control icons by re-enabling them
  if (this.options.controlIconsEnabled) {
    this.getPublicInstance().disableControlIcons()
    this.getPublicInstance().enableControlIcons()
  }
}

/**
 * Unbind mouse events, free callbacks and destroy public instance
 */
SvgPanZoom.prototype.destroy = function() {
  var that = this

  // Free callbacks
  this.beforeZoom = null
  this.onZoom = null
  this.beforePan = null
  this.onPan = null

  // Destroy custom event handlers
  if (this.options.customEventsHandler != null) { // jshint ignore:line
    this.options.customEventsHandler.destroy({
      svgElement: this.svg
    , eventsListenerElement: this.options.eventsListenerElement
    , instance: this.getPublicInstance()
    })
  }

  // Unbind eventListeners
  for (var event in this.eventListeners) {
    (this.options.eventsListenerElement || this.svg)
      .removeEventListener(event, this.eventListeners[event], false)
  }

  // Unbind wheelListener
  this.disableMouseWheelZoom()

  // Remove control icons
  this.getPublicInstance().disableControlIcons()

  // Reset zoom and pan
  this.reset()

  // Remove instance from instancesStore
  instancesStore = instancesStore.filter(function(instance){
    return instance.svg !== that.svg
  })

  // Delete options and its contents
  delete this.options

  // Destroy public instance and rewrite getPublicInstance
  delete this.publicInstance
  delete this.pi
  this.getPublicInstance = function(){
    return null
  }
}

/**
 * Returns a public instance object
 *
 * @return {Object} Public instance object
 */
SvgPanZoom.prototype.getPublicInstance = function() {
  var that = this

  // Create cache
  if (!this.publicInstance) {
    this.publicInstance = this.pi = {
      // Pan
      enablePan: function() {that.options.panEnabled = true; return that.pi}
    , disablePan: function() {that.options.panEnabled = false; return that.pi}
    , isPanEnabled: function() {return !!that.options.panEnabled}
    , pan: function(point) {that.pan(point); return that.pi}
    , panBy: function(point) {that.panBy(point); return that.pi}
    , getPan: function() {return that.getPan()}
      // Pan event
    , setBeforePan: function(fn) {that.options.beforePan = fn === null ? null : Utils.proxy(fn, that.publicInstance); return that.pi}
    , setOnPan: function(fn) {that.options.onPan = fn === null ? null : Utils.proxy(fn, that.publicInstance); return that.pi}
      // Zoom and Control Icons
    , enableZoom: function() {that.options.zoomEnabled = true; return that.pi}
    , disableZoom: function() {that.options.zoomEnabled = false; return that.pi}
    , isZoomEnabled: function() {return !!that.options.zoomEnabled}
    , enableControlIcons: function() {
        if (!that.options.controlIconsEnabled) {
          that.options.controlIconsEnabled = true
          ControlIcons.enable(that)
        }
        return that.pi
      }
    , disableControlIcons: function() {
        if (that.options.controlIconsEnabled) {
          that.options.controlIconsEnabled = false;
          ControlIcons.disable(that)
        }
        return that.pi
      }
    , isControlIconsEnabled: function() {return !!that.options.controlIconsEnabled}
      // Double click zoom
    , enableDblClickZoom: function() {that.options.dblClickZoomEnabled = true; return that.pi}
    , disableDblClickZoom: function() {that.options.dblClickZoomEnabled = false; return that.pi}
    , isDblClickZoomEnabled: function() {return !!that.options.dblClickZoomEnabled}
      // Mouse wheel zoom
    , enableMouseWheelZoom: function() {that.enableMouseWheelZoom(); return that.pi}
    , disableMouseWheelZoom: function() {that.disableMouseWheelZoom(); return that.pi}
    , isMouseWheelZoomEnabled: function() {return !!that.options.mouseWheelZoomEnabled}
      // Zoom scale and bounds
    , setZoomScaleSensitivity: function(scale) {that.options.zoomScaleSensitivity = scale; return that.pi}
    , setMinZoom: function(zoom) {that.options.minZoom = zoom; return that.pi}
    , setMaxZoom: function(zoom) {that.options.maxZoom = zoom; return that.pi}
      // Zoom event
    , setBeforeZoom: function(fn) {that.options.beforeZoom = fn === null ? null : Utils.proxy(fn, that.publicInstance); return that.pi}
    , setOnZoom: function(fn) {that.options.onZoom = fn === null ? null : Utils.proxy(fn, that.publicInstance); return that.pi}
      // Zooming
    , zoom: function(scale) {that.publicZoom(scale, true); return that.pi}
    , zoomBy: function(scale) {that.publicZoom(scale, false); return that.pi}
    , zoomAtPoint: function(scale, point) {that.publicZoomAtPoint(scale, point, true); return that.pi}
    , zoomAtPointBy: function(scale, point) {that.publicZoomAtPoint(scale, point, false); return that.pi}
    , zoomIn: function() {this.zoomBy(1 + that.options.zoomScaleSensitivity); return that.pi}
    , zoomOut: function() {this.zoomBy(1 / (1 + that.options.zoomScaleSensitivity)); return that.pi}
    , getZoom: function() {return that.getRelativeZoom()}
      // Reset
    , resetZoom: function() {that.resetZoom(); return that.pi}
    , resetPan: function() {that.resetPan(); return that.pi}
    , reset: function() {that.reset(); return that.pi}
      // Fit, Contain and Center
    , fit: function() {that.fit(); return that.pi}
    , contain: function() {that.contain(); return that.pi}
    , center: function() {that.center(); return that.pi}
      // Size and Resize
    , updateBBox: function() {that.updateBBox(); return that.pi}
    , resize: function() {that.resize(); return that.pi}
    , getSizes: function() {
        return {
          width: that.width
        , height: that.height
        , realZoom: that.getZoom()
        , viewBox: that.viewport.getViewBox()
        }
      }
      // Destroy
    , destroy: function() {that.destroy(); return that.pi}
    }
  }

  return this.publicInstance
}

/**
 * Stores pairs of instances of SvgPanZoom and SVG
 * Each pair is represented by an object {svg: SVGSVGElement, instance: SvgPanZoom}
 *
 * @type {Array}
 */
var instancesStore = []

var svgPanZoom = function(elementOrSelector, options){
  var svg = Utils.getSvg(elementOrSelector)

  if (svg === null) {
    return null
  } else {
    // Look for existent instance
    for(var i = instancesStore.length - 1; i >= 0; i--) {
      if (instancesStore[i].svg === svg) {
        return instancesStore[i].instance.getPublicInstance()
      }
    }

    // If instance not found - create one
    instancesStore.push({
      svg: svg
    , instance: new SvgPanZoom(svg, options)
    })

    // Return just pushed instance
    return instancesStore[instancesStore.length - 1].instance.getPublicInstance()
  }
}

module.exports = svgPanZoom;

},{"./control-icons":2,"./shadow-viewport":3,"./svg-utilities":5,"./uniwheel":6,"./utilities":7}],5:[function(require,module,exports){
var Utils = require('./utilities')
  , _browser = 'unknown'
  ;

// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
if (/*@cc_on!@*/false || !!document.documentMode) { // internet explorer
  _browser = 'ie';
}

module.exports = {
  svgNS:  'http://www.w3.org/2000/svg'
, xmlNS:  'http://www.w3.org/XML/1998/namespace'
, xmlnsNS:  'http://www.w3.org/2000/xmlns/'
, xlinkNS:  'http://www.w3.org/1999/xlink'
, evNS:  'http://www.w3.org/2001/xml-events'

  /**
   * Get svg dimensions: width and height
   *
   * @param  {SVGSVGElement} svg
   * @return {Object}     {width: 0, height: 0}
   */
, getBoundingClientRectNormalized: function(svg) {
    if (svg.clientWidth && svg.clientHeight) {
      return {width: svg.clientWidth, height: svg.clientHeight}
    } else if (!!svg.getBoundingClientRect()) {
      return svg.getBoundingClientRect();
    } else {
      throw new Error('Cannot get BoundingClientRect for SVG.');
    }
  }

  /**
   * Gets g element with class of "viewport" or creates it if it doesn't exist
   *
   * @param  {SVGSVGElement} svg
   * @return {SVGElement}     g (group) element
   */
, getOrCreateViewport: function(svg, selector) {
    var viewport = null

    if (Utils.isElement(selector)) {
      viewport = selector
    } else {
      viewport = svg.querySelector(selector)
    }

    // Check if there is just one main group in SVG
    if (!viewport) {
      var childNodes = Array.prototype.slice.call(svg.childNodes || svg.children).filter(function(el){
        return el.nodeName !== 'defs' && el.nodeName !== '#text'
      })

      // Node name should be SVGGElement and should have no transform attribute
      // Groups with transform are not used as viewport because it involves parsing of all transform possibilities
      if (childNodes.length === 1 && childNodes[0].nodeName === 'g' && childNodes[0].getAttribute('transform') === null) {
        viewport = childNodes[0]
      }
    }

    // If no favorable group element exists then create one
    if (!viewport) {
      var viewportId = 'viewport-' + new Date().toISOString().replace(/\D/g, '');
      viewport = document.createElementNS(this.svgNS, 'g');
      viewport.setAttribute('id', viewportId);

      // Internet Explorer (all versions?) can't use childNodes, but other browsers prefer (require?) using childNodes
      var svgChildren = svg.childNodes || svg.children;
      if (!!svgChildren && svgChildren.length > 0) {
        for (var i = svgChildren.length; i > 0; i--) {
          // Move everything into viewport except defs
          if (svgChildren[svgChildren.length - i].nodeName !== 'defs') {
            viewport.appendChild(svgChildren[svgChildren.length - i]);
          }
        }
      }
      svg.appendChild(viewport);
    }

    // Parse class names
    var classNames = [];
    if (viewport.getAttribute('class')) {
      classNames = viewport.getAttribute('class').split(' ')
    }

    // Set class (if not set already)
    if (!~classNames.indexOf('svg-pan-zoom_viewport')) {
      classNames.push('svg-pan-zoom_viewport')
      viewport.setAttribute('class', classNames.join(' '))
    }

    return viewport
  }

  /**
   * Set SVG attributes
   *
   * @param  {SVGSVGElement} svg
   */
  , setupSvgAttributes: function(svg) {
    // Setting default attributes
    svg.setAttribute('xmlns', this.svgNS);
    svg.setAttributeNS(this.xmlnsNS, 'xmlns:xlink', this.xlinkNS);
    svg.setAttributeNS(this.xmlnsNS, 'xmlns:ev', this.evNS);

    // Needed for Internet Explorer, otherwise the viewport overflows
    if (svg.parentNode !== null) {
      var style = svg.getAttribute('style') || '';
      if (style.toLowerCase().indexOf('overflow') === -1) {
        svg.setAttribute('style', 'overflow: hidden; ' + style);
      }
    }
  }

/**
 * How long Internet Explorer takes to finish updating its display (ms).
 */
, internetExplorerRedisplayInterval: 300

/**
 * Forces the browser to redisplay all SVG elements that rely on an
 * element defined in a 'defs' section. It works globally, for every
 * available defs element on the page.
 * The throttling is intentionally global.
 *
 * This is only needed for IE. It is as a hack to make markers (and 'use' elements?)
 * visible after pan/zoom when there are multiple SVGs on the page.
 * See bug report: https://connect.microsoft.com/IE/feedback/details/781964/
 * also see svg-pan-zoom issue: https://github.com/ariutta/svg-pan-zoom/issues/62
 */
, refreshDefsGlobal: Utils.throttle(function() {
    var allDefs = document.querySelectorAll('defs');
    var allDefsCount = allDefs.length;
    for (var i = 0; i < allDefsCount; i++) {
      var thisDefs = allDefs[i];
      thisDefs.parentNode.insertBefore(thisDefs, thisDefs);
    }
  }, this.internetExplorerRedisplayInterval)

  /**
   * Sets the current transform matrix of an element
   *
   * @param {SVGElement} element
   * @param {SVGMatrix} matrix  CTM
   * @param {SVGElement} defs
   */
, setCTM: function(element, matrix, defs) {
    var that = this
      , s = 'matrix(' + matrix.a + ',' + matrix.b + ',' + matrix.c + ',' + matrix.d + ',' + matrix.e + ',' + matrix.f + ')';

    element.setAttributeNS(null, 'transform', s);

    // IE has a bug that makes markers disappear on zoom (when the matrix "a" and/or "d" elements change)
    // see http://stackoverflow.com/questions/17654578/svg-marker-does-not-work-in-ie9-10
    // and http://srndolha.wordpress.com/2013/11/25/svg-line-markers-may-disappear-in-internet-explorer-11/
    if (_browser === 'ie' && !!defs) {
      // this refresh is intended for redisplaying the SVG during zooming
      defs.parentNode.insertBefore(defs, defs);
      // this refresh is intended for redisplaying the other SVGs on a page when panning a given SVG
      // it is also needed for the given SVG itself, on zoomEnd, if the SVG contains any markers that
      // are located under any other element(s).
      window.setTimeout(function() {
        that.refreshDefsGlobal();
      }, that.internetExplorerRedisplayInterval);
    }
  }

  /**
   * Instantiate an SVGPoint object with given event coordinates
   *
   * @param {Event} evt
   * @param  {SVGSVGElement} svg
   * @return {SVGPoint}     point
   */
, getEventPoint: function(evt, svg) {
    var point = svg.createSVGPoint()

    Utils.mouseAndTouchNormalize(evt, svg)

    point.x = evt.clientX
    point.y = evt.clientY

    return point
  }

  /**
   * Get SVG center point
   *
   * @param  {SVGSVGElement} svg
   * @return {SVGPoint}
   */
, getSvgCenterPoint: function(svg, width, height) {
    return this.createSVGPoint(svg, width / 2, height / 2)
  }

  /**
   * Create a SVGPoint with given x and y
   *
   * @param  {SVGSVGElement} svg
   * @param  {Number} x
   * @param  {Number} y
   * @return {SVGPoint}
   */
, createSVGPoint: function(svg, x, y) {
    var point = svg.createSVGPoint()
    point.x = x
    point.y = y

    return point
  }
}

},{"./utilities":7}],6:[function(require,module,exports){
// uniwheel 0.1.2 (customized)
// A unified cross browser mouse wheel event handler
// https://github.com/teemualap/uniwheel

module.exports = (function(){

  //Full details: https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel

  var prefix = "", _addEventListener, _removeEventListener, onwheel, support, fns = [];

  // detect event model
  if ( window.addEventListener ) {
    _addEventListener = "addEventListener";
    _removeEventListener = "removeEventListener";
  } else {
    _addEventListener = "attachEvent";
    _removeEventListener = "detachEvent";
    prefix = "on";
  }

  // detect available wheel event
  support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
            document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
            "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox


  function createCallback(element,callback,capture) {

    var fn = function(originalEvent) {

      !originalEvent && ( originalEvent = window.event );

      // create a normalized event object
      var event = {
        // keep a ref to the original event object
        originalEvent: originalEvent,
        target: originalEvent.target || originalEvent.srcElement,
        type: "wheel",
        deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
        deltaX: 0,
        delatZ: 0,
        preventDefault: function() {
          originalEvent.preventDefault ?
            originalEvent.preventDefault() :
            originalEvent.returnValue = false;
        }
      };

      // calculate deltaY (and deltaX) according to the event
      if ( support == "mousewheel" ) {
        event.deltaY = - 1/40 * originalEvent.wheelDelta;
        // Webkit also support wheelDeltaX
        originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
      } else {
        event.deltaY = originalEvent.detail;
      }

      // it's time to fire the callback
      return callback( event );

    };

    fns.push({
      element: element,
      fn: fn,
      capture: capture
    });

    return fn;
  }

  function getCallback(element,capture) {
    for (var i = 0; i < fns.length; i++) {
      if (fns[i].element === element && fns[i].capture === capture) {
        return fns[i].fn;
      }
    }
    return function(){};
  }

  function removeCallback(element,capture) {
    for (var i = 0; i < fns.length; i++) {
      if (fns[i].element === element && fns[i].capture === capture) {
        return fns.splice(i,1);
      }
    }
  }

  function _addWheelListener( elem, eventName, callback, useCapture ) {

    var cb;

    if (support === "wheel") {
      cb = callback;
    } else {
      cb = createCallback(elem,callback,useCapture);
    }

    elem[ _addEventListener ]( prefix + eventName, cb, useCapture || false );

  }

  function _removeWheelListener( elem, eventName, callback, useCapture ) {

    if (support === "wheel") {
      cb = callback;
    } else {
      cb = getCallback(elem,useCapture);
    }

    elem[ _removeEventListener ]( prefix + eventName, cb, useCapture || false );

    removeCallback(elem,useCapture);

  }

  function addWheelListener( elem, callback, useCapture ) {
    _addWheelListener( elem, support, callback, useCapture );

    // handle MozMousePixelScroll in older Firefox
    if( support == "DOMMouseScroll" ) {
        _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture);
    }
  }

  function removeWheelListener(elem,callback,useCapture){
    _removeWheelListener(elem,support,callback,useCapture);

    // handle MozMousePixelScroll in older Firefox
    if( support == "DOMMouseScroll" ) {
        _removeWheelListener(elem, "MozMousePixelScroll", callback, useCapture);
    }
  }

  return {
    on: addWheelListener,
    off: removeWheelListener
  };

})();

},{}],7:[function(require,module,exports){
module.exports = {
  /**
   * Extends an object
   *
   * @param  {Object} target object to extend
   * @param  {Object} source object to take properties from
   * @return {Object}        extended object
   */
  extend: function(target, source) {
    target = target || {};
    for (var prop in source) {
      // Go recursively
      if (this.isObject(source[prop])) {
        target[prop] = this.extend(target[prop], source[prop])
      } else {
        target[prop] = source[prop]
      }
    }
    return target;
  }

  /**
   * Checks if an object is a DOM element
   *
   * @param  {Object}  o HTML element or String
   * @return {Boolean}   returns true if object is a DOM element
   */
, isElement: function(o){
    return (
      o instanceof HTMLElement || o instanceof SVGElement || o instanceof SVGSVGElement || //DOM2
      (o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string')
    );
  }

  /**
   * Checks if an object is an Object
   *
   * @param  {Object}  o Object
   * @return {Boolean}   returns true if object is an Object
   */
, isObject: function(o){
    return Object.prototype.toString.call(o) === '[object Object]';
  }

  /**
   * Checks if variable is Number
   *
   * @param  {Integer|Float}  n
   * @return {Boolean}   returns true if variable is Number
   */
, isNumber: function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /**
   * Search for an SVG element
   *
   * @param  {Object|String} elementOrSelector DOM Element or selector String
   * @return {Object|Null}                   SVG or null
   */
, getSvg: function(elementOrSelector) {
    var element
      , svg;

    if (!this.isElement(elementOrSelector)) {
      // If selector provided
      if (typeof elementOrSelector === 'string' || elementOrSelector instanceof String) {
        // Try to find the element
        element = document.querySelector(elementOrSelector)

        if (!element) {
          throw new Error('Provided selector did not find any elements. Selector: ' + elementOrSelector)
          return null
        }
      } else {
        throw new Error('Provided selector is not an HTML object nor String')
        return null
      }
    } else {
      element = elementOrSelector
    }

    if (element.tagName.toLowerCase() === 'svg') {
      svg = element;
    } else {
      if (element.tagName.toLowerCase() === 'object') {
        svg = element.contentDocument.documentElement;
      } else {
        if (element.tagName.toLowerCase() === 'embed') {
          svg = element.getSVGDocument().documentElement;
        } else {
          if (element.tagName.toLowerCase() === 'img') {
            throw new Error('Cannot script an SVG in an "img" element. Please use an "object" element or an in-line SVG.');
          } else {
            throw new Error('Cannot get SVG.');
          }
          return null
        }
      }
    }

    return svg
  }

  /**
   * Attach a given context to a function
   * @param  {Function} fn      Function
   * @param  {Object}   context Context
   * @return {Function}           Function with certain context
   */
, proxy: function(fn, context) {
    return function() {
      return fn.apply(context, arguments)
    }
  }

  /**
   * Returns object type
   * Uses toString that returns [object SVGPoint]
   * And than parses object type from string
   *
   * @param  {Object} o Any object
   * @return {String}   Object type
   */
, getType: function(o) {
    return Object.prototype.toString.apply(o).replace(/^\[object\s/, '').replace(/\]$/, '')
  }

  /**
   * If it is a touch event than add clientX and clientY to event object
   *
   * @param  {Event} evt
   * @param  {SVGSVGElement} svg
   */
, mouseAndTouchNormalize: function(evt, svg) {
    // If no cilentX and but touch objects are available
    if (evt.clientX === void 0 || evt.clientX === null) {
      // Fallback
      evt.clientX = 0
      evt.clientY = 0

      // If it is a touch event
      if (evt.changedTouches !== void 0 && evt.changedTouches.length) {
        // If touch event has changedTouches
        if (evt.changedTouches[0].clientX !== void 0) {
          evt.clientX = evt.changedTouches[0].clientX
          evt.clientY = evt.changedTouches[0].clientY
        }
        // If changedTouches has pageX attribute
        else if (evt.changedTouches[0].pageX !== void 0) {
          var rect = svg.getBoundingClientRect();

          evt.clientX = evt.changedTouches[0].pageX - rect.left
          evt.clientY = evt.changedTouches[0].pageY - rect.top
        }
      // If it is a custom event
      } else if (evt.originalEvent !== void 0) {
        if (evt.originalEvent.clientX !== void 0) {
          evt.clientX = evt.originalEvent.clientX
          evt.clientY = evt.originalEvent.clientY
        }
      }
    }
  }

  /**
   * Check if an event is a double click/tap
   * TODO: For touch gestures use a library (hammer.js) that takes in account other events
   * (touchmove and touchend). It should take in account tap duration and traveled distance
   *
   * @param  {Event}  evt
   * @param  {Event}  prevEvt Previous Event
   * @return {Boolean}
   */
, isDblClick: function(evt, prevEvt) {
    // Double click detected by browser
    if (evt.detail === 2) {
      return true;
    }
    // Try to compare events
    else if (prevEvt !== void 0 && prevEvt !== null) {
      var timeStampDiff = evt.timeStamp - prevEvt.timeStamp // should be lower than 250 ms
        , touchesDistance = Math.sqrt(Math.pow(evt.clientX - prevEvt.clientX, 2) + Math.pow(evt.clientY - prevEvt.clientY, 2))

      return timeStampDiff < 250 && touchesDistance < 10
    }

    // Nothing found
    return false;
  }

  /**
   * Returns current timestamp as an integer
   *
   * @return {Number}
   */
, now: Date.now || function() {
    return new Date().getTime();
  }

  // From underscore.
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
// jscs:disable
// jshint ignore:start
, throttle: function(func, wait, options) {
    var that = this;
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : that.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = that.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }
// jshint ignore:end
// jscs:enable

  /**
   * Create a requestAnimationFrame simulation
   *
   * @param  {Number|String} refreshRate
   * @return {Function}
   */
, createRequestAnimationFrame: function(refreshRate) {
    var timeout = null

    // Convert refreshRate to timeout
    if (refreshRate !== 'auto' && refreshRate < 60 && refreshRate > 1) {
      timeout = Math.floor(1000 / refreshRate)
    }

    if (timeout === null) {
      return window.requestAnimationFrame || requestTimeout(33)
    } else {
      return requestTimeout(timeout)
    }
  }
}

/**
 * Create a callback that will execute after a given timeout
 *
 * @param  {Function} timeout
 * @return {Function}
 */
function requestTimeout(timeout) {
  return function(callback) {
    window.setTimeout(callback, timeout)
  }
}

},{}]},{},[1]);
;
/*! Hammer.JS - v2.0.6 - 2015-12-23
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2015 Jorik Tangelder;
 * Licensed under the  license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean=false} [merge]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.allow = true; // used by Input.TouchMouse to disable mouse events
    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down, and mouse events are allowed (see the TouchMouse input)
        if (!this.pressed || !this.allow) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */
function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        // when we're in a touch event, so  block all upcoming mouse events
        // most mobile browser also emit mouseevents, right after touchstart
        if (isTouch) {
            this.mouse.allow = false;
        } else if (isMouse && !this.mouse.allow) {
            return;
        }

        // reset the allowMouse when we're done
        if (inputEvent & (INPUT_END | INPUT_CANCEL)) {
            this.mouse.allow = true;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        // not needed with native support for the touchAction property
        if (NATIVE_TOUCH_ACTION) {
            return;
        }

        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.6';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    each(manager.options.cssProps, function(value, name) {
        element.style[prefixed(element.style, name)] = add ? value : '';
    });
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');
;
/*
 Highstock JS v4.2.5 (2016-05-06)

 (c) 2009-2016 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(L,ga){typeof module==="object"&&module.exports?module.exports=L.document?ga(L):ga:L.Highcharts=ga(L)})(typeof window!=="undefined"?window:this,function(L){function ga(a,b){var c="Highcharts error #"+a+": www.highcharts.com/errors/"+a;if(b)throw Error(c);L.console&&console.log(c)}function xb(a,b,c){this.options=b;this.elem=a;this.prop=c}function z(){var a,b=arguments,c,d={},e=function(a,b){var c,d;typeof a!=="object"&&(a={});for(d in b)b.hasOwnProperty(d)&&(c=b[d],a[d]=c&&typeof c==="object"&&
Object.prototype.toString.call(c)!=="[object Array]"&&d!=="renderTo"&&typeof c.nodeType!=="number"?e(a[d]||{},c):b[d]);return a};b[0]===!0&&(d=b[1],b=Array.prototype.slice.call(b,2));c=b.length;for(a=0;a<c;a++)d=e(d,b[a]);return d}function K(a,b){return parseInt(a,b||10)}function Ca(a){return typeof a==="string"}function ea(a){return a&&typeof a==="object"}function Ja(a){return Object.prototype.toString.call(a)==="[object Array]"}function za(a,b){for(var c=a.length;c--;)if(a[c]===b){a.splice(c,1);
break}}function v(a){return a!==t&&a!==null}function X(a,b,c){var d,e;if(Ca(b))v(c)?a.setAttribute(b,c):a&&a.getAttribute&&(e=a.getAttribute(b));else if(v(b)&&ea(b))for(d in b)a.setAttribute(d,b[d]);return e}function ua(a){return Ja(a)?a:[a]}function Za(a,b,c){if(b)return setTimeout(a,b,c);a.call(0,c)}function N(a,b){if(Ka&&!ja&&b&&b.opacity!==t)b.filter="alpha(opacity="+b.opacity*100+")";A(a.style,b)}function fa(a,b,c,d,e){a=H.createElement(a);b&&A(a,b);e&&N(a,{padding:0,border:"none",margin:0});
c&&N(a,c);d&&d.appendChild(a);return a}function ma(a,b){var c=function(){};c.prototype=new a;A(c.prototype,b);return c}function Oa(a,b,c){return Array((b||2)+1-String(a).length).join(c||0)+a}function eb(a){return(fb&&fb(a)||yb||0)*6E4}function La(a,b){for(var c="{",d=!1,e,f,g,h,i,j=[];(c=a.indexOf(c))!==-1;){e=a.slice(0,c);if(d){f=e.split(":");g=f.shift().split(".");i=g.length;e=b;for(h=0;h<i;h++)e=e[g[h]];if(f.length)f=f.join(":"),g=/\.([0-9])/,h=R.lang,i=void 0,/f$/.test(f)?(i=(i=f.match(g))?i[1]:
-1,e!==null&&(e=B.numberFormat(e,i,h.decimalPoint,f.indexOf(",")>-1?h.thousandsSep:""))):e=na(f,e)}j.push(e);a=a.slice(c+1);c=(d=!d)?"}":"{"}j.push(a);return j.join("")}function zb(a){return Y.pow(10,V(Y.log(a)/Y.LN10))}function Ab(a,b,c,d,e){var f,g=a,c=q(c,1);f=a/c;b||(b=[1,2,2.5,5,10],d===!1&&(c===1?b=[1,2,5,10]:c<=0.1&&(b=[1/c])));for(d=0;d<b.length;d++)if(g=b[d],e&&g*c>=a||!e&&f<=(b[d]+(b[d+1]||b[d]))/2)break;g*=c;return g}function nb(a,b){var c=a.length,d,e;for(e=0;e<c;e++)a[e].safeI=e;a.sort(function(a,
c){d=b(a,c);return d===0?a.safeI-c.safeI:d});for(e=0;e<c;e++)delete a[e].safeI}function Ma(a){for(var b=a.length,c=a[0];b--;)a[b]<c&&(c=a[b]);return c}function Da(a){for(var b=a.length,c=a[0];b--;)a[b]>c&&(c=a[b]);return c}function Pa(a,b){for(var c in a)a[c]&&a[c]!==b&&a[c].destroy&&a[c].destroy(),delete a[c]}function Ua(a){ob||(ob=fa(Va));a&&ob.appendChild(a);ob.innerHTML=""}function ka(a,b){return parseFloat(a.toPrecision(b||14))}function $a(a,b){b.renderer.globalAnimation=q(a,b.animation)}function gb(a){return ea(a)?
z(a):{duration:a?500:0}}function Ob(){var a=R.global,b=a.useUTC,c=b?"getUTC":"get",d=b?"setUTC":"set";ba=a.Date||L.Date;yb=b&&a.timezoneOffset;fb=b&&a.getTimezoneOffset;pb=function(a,c,d,h,i,j){var k;b?(k=ba.UTC.apply(0,arguments),k+=eb(k)):k=(new ba(a,c,q(d,1),q(h,0),q(i,0),q(j,0))).getTime();return k};Bb=c+"Minutes";Cb=c+"Hours";Db=c+"Day";ab=c+"Date";hb=c+"Month";ib=c+"FullYear";Pb=d+"Milliseconds";Qb=d+"Seconds";Rb=d+"Minutes";Sb=d+"Hours";qb=d+"Date";Eb=d+"Month";Fb=d+"FullYear"}function va(a){if(!(this instanceof
va))return new va(a);this.init(a)}function Z(){}function bb(a,b,c,d){this.axis=a;this.pos=b;this.type=c||"";this.isNew=!0;!c&&!d&&this.addLabel()}function Tb(a,b,c,d,e){var f=a.chart.inverted;this.axis=a;this.isNegative=c;this.options=b;this.x=d;this.total=null;this.points={};this.stack=e;this.rightCliff=this.leftCliff=0;this.alignOptions={align:b.align||(f?c?"left":"right":"center"),verticalAlign:b.verticalAlign||(f?"middle":c?"bottom":"top"),y:q(b.y,f?4:c?14:-6),x:q(b.x,f?c?-6:6:0)};this.textAlign=
b.textAlign||(f?c?"right":"left":"center")}function Gb(a){var b=a.options,c=b.navigator,d=c.enabled,b=b.scrollbar,e=b.enabled,f=d?c.height:0,g=e?b.height:0;this.handles=[];this.scrollbarButtons=[];this.elementsToDestroy=[];this.chart=a;this.setBaseSeries();this.height=f;this.scrollbarHeight=g;this.scrollbarEnabled=e;this.navigatorEnabled=d;this.navigatorOptions=c;this.scrollbarOptions=b;this.outlineHeight=f+g;this.init()}function Hb(a){this.init(a)}var t,H=L.document,Y=Math,y=Y.round,V=Y.floor,Ea=
Y.ceil,w=Y.max,G=Y.min,S=Y.abs,ca=Y.cos,la=Y.sin,Aa=Y.PI,pa=Aa*2/360,Na=L.navigator&&L.navigator.userAgent||"",Ub=L.opera,Ka=/(msie|trident|edge)/i.test(Na)&&!Ub,rb=H&&H.documentMode===8,sb=!Ka&&/AppleWebKit/.test(Na),Wa=/Firefox/.test(Na),jb=/(Mobile|Android|Windows Phone)/.test(Na),Qa="http://www.w3.org/2000/svg",ja=H&&H.createElementNS&&!!H.createElementNS(Qa,"svg").createSVGRect,Zb=Wa&&parseInt(Na.split("Firefox/")[1],10)<4,qa=H&&!ja&&!Ka&&!!H.createElement("canvas").getContext,Xa,cb,Vb={},Ib=
0,ob,R,na,M,ra=function(){},$=[],kb=0,Va="div",$b=/^[0-9]+$/,tb=["plotTop","marginRight","marginBottom","plotLeft"],ba,pb,yb,fb,Bb,Cb,Db,ab,hb,ib,Pb,Qb,Rb,Sb,qb,Eb,Fb,I={},B;B=L.Highcharts?ga(16,!0):{win:L};B.seriesTypes=I;var Ra=[],wa,sa,o,Fa,Jb,ta,E,T,O,db,Sa;xb.prototype={dSetter:function(){var a=this.paths[0],b=this.paths[1],c=[],d=this.now,e=a.length,f;if(d===1)c=this.toD;else if(e===b.length&&d<1)for(;e--;)f=parseFloat(a[e]),c[e]=isNaN(f)?a[e]:d*parseFloat(b[e]-f)+f;else c=b;this.elem.attr("d",
c)},update:function(){var a=this.elem,b=this.prop,c=this.now,d=this.options.step;if(this[b+"Setter"])this[b+"Setter"]();else a.attr?a.element&&a.attr(b,c):a.style[b]=c+this.unit;d&&d.call(a,c,this)},run:function(a,b,c){var d=this,e=function(a){return e.stopped?!1:d.step(a)},f;this.startTime=+new ba;this.start=a;this.end=b;this.unit=c;this.now=this.start;this.pos=0;e.elem=this.elem;if(e()&&Ra.push(e)===1)e.timerId=setInterval(function(){for(f=0;f<Ra.length;f++)Ra[f]()||Ra.splice(f--,1);Ra.length||
clearInterval(e.timerId)},13)},step:function(a){var b=+new ba,c,d=this.options;c=this.elem;var e=d.complete,f=d.duration,g=d.curAnim,h;if(c.attr&&!c.element)c=!1;else if(a||b>=f+this.startTime){this.now=this.end;this.pos=1;this.update();a=g[this.prop]=!0;for(h in g)g[h]!==!0&&(a=!1);a&&e&&e.call(c);c=!1}else this.pos=d.easing((b-this.startTime)/f),this.now=this.start+(this.end-this.start)*this.pos,this.update(),c=!0;return c},initPath:function(a,b,c){var b=b||"",d=a.shift,e=b.indexOf("C")>-1,f=e?
7:3,g,b=b.split(" "),c=[].concat(c),h=a.isArea,i=h?2:1,j=function(a){for(g=a.length;g--;)(a[g]==="M"||a[g]==="L")&&a.splice(g+1,0,a[g+1],a[g+2],a[g+1],a[g+2])};e&&(j(b),j(c));if(d<=c.length/f&&b.length===c.length)for(;d--;)c=c.slice(0,f).concat(c),h&&(c=c.concat(c.slice(c.length-f)));a.shift=0;if(b.length)for(a=c.length;b.length<a;)d=b.slice().splice(b.length/i-f,f*i),e&&(d[f-6]=d[f-2],d[f-5]=d[f-1]),[].splice.apply(b,[b.length/i,0].concat(d));return[b,c]}};var A=B.extend=function(a,b){var c;a||(a=
{});for(c in b)a[c]=b[c];return a},C=B.isNumber=function(a){return typeof a==="number"&&!isNaN(a)},q=B.pick=function(){var a=arguments,b,c,d=a.length;for(b=0;b<d;b++)if(c=a[b],c!==t&&c!==null)return c},U=B.wrap=function(a,b,c){var d=a[b];a[b]=function(){var a=Array.prototype.slice.call(arguments);a.unshift(d);return c.apply(this,a)}};na=function(a,b,c){if(!C(b))return R.lang.invalidDate||"";var a=q(a,"%Y-%m-%d %H:%M:%S"),d=new ba(b-eb(b)),e,f=d[Cb](),g=d[Db](),h=d[ab](),i=d[hb](),j=d[ib](),k=R.lang,
l=k.weekdays,m=k.shortWeekdays,d=A({a:m?m[g]:l[g].substr(0,3),A:l[g],d:Oa(h),e:Oa(h,2," "),w:g,b:k.shortMonths[i],B:k.months[i],m:Oa(i+1),y:j.toString().substr(2,2),Y:j,H:Oa(f),k:f,I:Oa(f%12||12),l:f%12||12,M:Oa(d[Bb]()),p:f<12?"AM":"PM",P:f<12?"am":"pm",S:Oa(d.getSeconds()),L:Oa(y(b%1E3),3)},B.dateFormats);for(e in d)for(;a.indexOf("%"+e)!==-1;)a=a.replace("%"+e,typeof d[e]==="function"?d[e](b):d[e]);return c?a.substr(0,1).toUpperCase()+a.substr(1):a};M={millisecond:1,second:1E3,minute:6E4,hour:36E5,
day:864E5,week:6048E5,month:24192E5,year:314496E5};B.numberFormat=function(a,b,c,d){var a=+a||0,b=+b,e=R.lang,f=(a.toString().split(".")[1]||"").length,g,h,i=Math.abs(a);b===-1?b=Math.min(f,20):C(b)||(b=2);g=String(K(i.toFixed(b)));h=g.length>3?g.length%3:0;c=q(c,e.decimalPoint);d=q(d,e.thousandsSep);a=a<0?"-":"";a+=h?g.substr(0,h)+d:"";a+=g.substr(h).replace(/(\d{3})(?=\d)/g,"$1"+d);b&&(d=Math.abs(i-g+Math.pow(10,-Math.max(b,f)-1)),a+=c+d.toFixed(b).slice(2));return a};Math.easeInOutSine=function(a){return-0.5*
(Math.cos(Math.PI*a)-1)};wa=function(a,b){var c;if(b==="width")return Math.min(a.offsetWidth,a.scrollWidth)-wa(a,"padding-left")-wa(a,"padding-right");else if(b==="height")return Math.min(a.offsetHeight,a.scrollHeight)-wa(a,"padding-top")-wa(a,"padding-bottom");return(c=L.getComputedStyle(a,void 0))&&K(c.getPropertyValue(b))};sa=function(a,b){return b.indexOf?b.indexOf(a):[].indexOf.call(b,a)};Fa=function(a,b){return[].filter.call(a,b)};ta=function(a,b){for(var c=[],d=0,e=a.length;d<e;d++)c[d]=b.call(a[d],
a[d],d,a);return c};Jb=function(a){var b=H.documentElement,a=a.getBoundingClientRect();return{top:a.top+(L.pageYOffset||b.scrollTop)-(b.clientTop||0),left:a.left+(L.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}};Sa=function(a){for(var b=Ra.length;b--;)if(Ra[b].elem===a)Ra[b].stopped=!0};o=function(a,b){return Array.prototype.forEach.call(a,b)};E=function(a,b,c){function d(b){b.target=b.srcElement||L;c.call(a,b)}var e=a.hcEvents=a.hcEvents||{};if(a.addEventListener)a.addEventListener(b,c,!1);else if(a.attachEvent){if(!a.hcEventsIE)a.hcEventsIE=
{};a.hcEventsIE[c.toString()]=d;a.attachEvent("on"+b,d)}e[b]||(e[b]=[]);e[b].push(c)};T=function(a,b,c){function d(b,c){a.removeEventListener?a.removeEventListener(b,c,!1):a.attachEvent&&(c=a.hcEventsIE[c.toString()],a.detachEvent("on"+b,c))}function e(){var c,e,f;if(a.nodeName)for(f in b?(c={},c[b]=!0):c=g,c)if(g[f])for(e=g[f].length;e--;)d(f,g[f][e])}var f,g=a.hcEvents,h;if(g)b?(f=g[b]||[],c?(h=sa(c,f),h>-1&&(f.splice(h,1),g[b]=f),d(b,c)):(e(),g[b]=[])):(e(),a.hcEvents={})};O=function(a,b,c,d){var e;
e=a.hcEvents;var f,g,c=c||{};if(H.createEvent&&(a.dispatchEvent||a.fireEvent))e=H.createEvent("Events"),e.initEvent(b,!0,!0),e.target=a,A(e,c),a.dispatchEvent?a.dispatchEvent(e):a.fireEvent(b,e);else if(e){e=e[b]||[];f=e.length;if(!c.preventDefault)c.preventDefault=function(){c.defaultPrevented=!0};c.target=a;if(!c.type)c.type=b;for(b=0;b<f;b++)g=e[b],g.call(a,c)===!1&&c.preventDefault()}d&&!c.defaultPrevented&&d(c)};db=function(a,b,c){var d,e="",f,g,h;ea(c)||(d=arguments,c={duration:d[2],easing:d[3],
complete:d[4]});if(!C(c.duration))c.duration=400;c.easing=typeof c.easing==="function"?c.easing:Math[c.easing]||Math.easeInOutSine;c.curAnim=z(b);for(h in b)g=new xb(a,c,h),f=null,h==="d"?(g.paths=g.initPath(a,a.d,b.d),g.toD=b.d,d=0,f=1):a.attr?d=a.attr(h):(d=parseFloat(wa(a,h))||0,h!=="opacity"&&(e="px")),f||(f=b[h]),f.match&&f.match("px")&&(f=f.replace(/px/g,"")),g.run(d,f,e)};if(L.jQuery)L.jQuery.fn.highcharts=function(){var a=[].slice.call(arguments);if(this[0])return a[0]?(new (B[Ca(a[0])?a.shift():
"Chart"])(this[0],a[0],a[1]),this):$[X(this[0],"data-highcharts-chart")]};H&&!H.defaultView&&(wa=function(a,b){var c;c={width:"clientWidth",height:"clientHeight"}[b];if(a.style[b])return K(a.style[b]);b==="opacity"&&(b="filter");if(c)return a.style.zoom=1,Math.max(a[c]-2*wa(a,"padding"),0);c=a.currentStyle[b.replace(/\-(\w)/g,function(a,b){return b.toUpperCase()})];b==="filter"&&(c=c.replace(/alpha\(opacity=([0-9]+)\)/,function(a,b){return b/100}));return c===""?1:K(c)});Array.prototype.forEach||
(o=function(a,b){for(var c=0,d=a.length;c<d;c++)if(b.call(a[c],a[c],c,a)===!1)return c});Array.prototype.indexOf||(sa=function(a,b){var c,d=0;if(b)for(c=b.length;d<c;d++)if(b[d]===a)return d;return-1});Array.prototype.filter||(Fa=function(a,b){for(var c=[],d=0,e=a.length;d<e;d++)b(a[d],d)&&c.push(a[d]);return c});B.Fx=xb;B.inArray=sa;B.each=o;B.grep=Fa;B.offset=Jb;B.map=ta;B.addEvent=E;B.removeEvent=T;B.fireEvent=O;B.animate=db;B.animObject=gb;B.stop=Sa;R={colors:"#7cb5ec,#434348,#90ed7d,#f7a35c,#8085e9,#f15c80,#e4d354,#2b908f,#f45b5b,#91e8e1".split(","),
symbols:["circle","diamond","square","triangle","triangle-down"],lang:{loading:"Loading...",months:"January,February,March,April,May,June,July,August,September,October,November,December".split(","),shortMonths:"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),weekdays:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),decimalPoint:".",numericSymbols:"k,M,G,T,P,E".split(","),resetZoom:"Reset zoom",resetZoomTitle:"Reset zoom level 1:1",thousandsSep:" "},global:{useUTC:!0,
canvasToolsURL:"https://code.highcharts.com/modules/canvas-tools.js",VMLRadialGradientURL:"https://code.highcharts.com/stock/4.2.5/gfx/vml-radial-gradient.png"},chart:{borderColor:"#4572A7",borderRadius:0,defaultSeriesType:"line",ignoreHiddenSeries:!0,spacing:[10,10,15,10],backgroundColor:"#FFFFFF",plotBorderColor:"#C0C0C0",resetZoomButton:{theme:{zIndex:20},position:{align:"right",x:-10,y:10}}},title:{text:"Chart title",align:"center",margin:15,style:{color:"#333333",fontSize:"18px"},widthAdjust:-44},
subtitle:{text:"",align:"center",style:{color:"#555555"},widthAdjust:-44},plotOptions:{line:{allowPointSelect:!1,showCheckbox:!1,animation:{duration:1E3},events:{},lineWidth:2,marker:{lineWidth:0,radius:4,lineColor:"#FFFFFF",states:{hover:{enabled:!0,lineWidthPlus:1,radiusPlus:2},select:{fillColor:"#FFFFFF",lineColor:"#000000",lineWidth:2}}},point:{events:{}},dataLabels:{align:"center",formatter:function(){return this.y===null?"":B.numberFormat(this.y,-1)},style:{color:"contrast",fontSize:"11px",
fontWeight:"bold",textShadow:"0 0 6px contrast, 0 0 3px contrast"},verticalAlign:"bottom",x:0,y:0,padding:5},cropThreshold:300,pointRange:0,softThreshold:!0,states:{hover:{lineWidthPlus:1,marker:{},halo:{size:10,opacity:0.25}},select:{marker:{}}},stickyTracking:!0,turboThreshold:1E3}},labels:{style:{position:"absolute",color:"#3E576F"}},legend:{enabled:!0,align:"center",layout:"horizontal",labelFormatter:function(){return this.name},borderColor:"#909090",borderRadius:0,navigation:{activeColor:"#274b6d",
inactiveColor:"#CCC"},shadow:!1,itemStyle:{color:"#333333",fontSize:"12px",fontWeight:"bold"},itemHoverStyle:{color:"#000"},itemHiddenStyle:{color:"#CCC"},itemCheckboxStyle:{position:"absolute",width:"13px",height:"13px"},symbolPadding:5,verticalAlign:"bottom",x:0,y:0,title:{style:{fontWeight:"bold"}}},loading:{labelStyle:{fontWeight:"bold",position:"relative",top:"45%"},style:{position:"absolute",backgroundColor:"white",opacity:0.5,textAlign:"center"}},tooltip:{enabled:!0,animation:ja,backgroundColor:"rgba(249, 249, 249, .85)",
borderWidth:1,borderRadius:3,dateTimeLabelFormats:{millisecond:"%A, %b %e, %H:%M:%S.%L",second:"%A, %b %e, %H:%M:%S",minute:"%A, %b %e, %H:%M",hour:"%A, %b %e, %H:%M",day:"%A, %b %e, %Y",week:"Week from %A, %b %e, %Y",month:"%B %Y",year:"%Y"},footerFormat:"",headerFormat:'<span style="font-size: 10px">{point.key}</span><br/>',pointFormat:'<span style="color:{point.color}">\u25cf</span> {series.name}: <b>{point.y}</b><br/>',shadow:!0,snap:jb?25:10,style:{color:"#333333",cursor:"default",fontSize:"12px",
padding:"8px",pointerEvents:"none",whiteSpace:"nowrap"}},credits:{enabled:!0,text:"Highcharts.com",href:"https://www.highcharts.com",position:{align:"right",x:-10,verticalAlign:"bottom",y:-5},style:{cursor:"pointer",color:"#909090",fontSize:"9px"}}};var W=R.plotOptions,da=W.line;Ob();va.prototype={parsers:[{regex:/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,parse:function(a){return[K(a[1]),K(a[2]),K(a[3]),parseFloat(a[4],10)]}},{regex:/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
parse:function(a){return[K(a[1],16),K(a[2],16),K(a[3],16),1]}},{regex:/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,parse:function(a){return[K(a[1]),K(a[2]),K(a[3]),1]}}],init:function(a){var b,c,d,e;if((this.input=a)&&a.stops)this.stops=ta(a.stops,function(a){return new va(a[1])});else for(d=this.parsers.length;d--&&!c;)e=this.parsers[d],(b=e.regex.exec(a))&&(c=e.parse(b));this.rgba=c||[]},get:function(a){var b=this.input,c=this.rgba,d;this.stops?(d=z(b),d.stops=[].concat(d.stops),
o(this.stops,function(b,c){d.stops[c]=[d.stops[c][0],b.get(a)]})):d=c&&C(c[0])?a==="rgb"||!a&&c[3]===1?"rgb("+c[0]+","+c[1]+","+c[2]+")":a==="a"?c[3]:"rgba("+c.join(",")+")":b;return d},brighten:function(a){var b,c=this.rgba;if(this.stops)o(this.stops,function(b){b.brighten(a)});else if(C(a)&&a!==0)for(b=0;b<3;b++)c[b]+=K(a*255),c[b]<0&&(c[b]=0),c[b]>255&&(c[b]=255);return this},setOpacity:function(a){this.rgba[3]=a;return this}};Z.prototype={opacity:1,textProps:"direction,fontSize,fontWeight,fontFamily,fontStyle,color,lineHeight,width,textDecoration,textOverflow,textShadow".split(","),
init:function(a,b){this.element=b==="span"?fa(b):H.createElementNS(Qa,b);this.renderer=a},animate:function(a,b,c){b=q(b,this.renderer.globalAnimation,!0);Sa(this);if(b){if(c)b.complete=c;db(this,a,b)}else this.attr(a,null,c);return this},colorGradient:function(a,b,c){var d=this.renderer,e,f,g,h,i,j,k,l,m,n,p,r=[],s;a.linearGradient?f="linearGradient":a.radialGradient&&(f="radialGradient");if(f){g=a[f];i=d.gradients;k=a.stops;n=c.radialReference;Ja(g)&&(a[f]=g={x1:g[0],y1:g[1],x2:g[2],y2:g[3],gradientUnits:"userSpaceOnUse"});
f==="radialGradient"&&n&&!v(g.gradientUnits)&&(h=g,g=z(g,d.getRadialAttr(n,h),{gradientUnits:"userSpaceOnUse"}));for(p in g)p!=="id"&&r.push(p,g[p]);for(p in k)r.push(k[p]);r=r.join(",");i[r]?n=i[r].attr("id"):(g.id=n="highcharts-"+Ib++,i[r]=j=d.createElement(f).attr(g).add(d.defs),j.radAttr=h,j.stops=[],o(k,function(a){a[1].indexOf("rgba")===0?(e=va(a[1]),l=e.get("rgb"),m=e.get("a")):(l=a[1],m=1);a=d.createElement("stop").attr({offset:a[0],"stop-color":l,"stop-opacity":m}).add(j);j.stops.push(a)}));
s="url("+d.url+"#"+n+")";c.setAttribute(b,s);c.gradient=r;a.toString=function(){return s}}},applyTextShadow:function(a){var b=this.element,c,d=a.indexOf("contrast")!==-1,e={},f=this.renderer.forExport,g=f||b.style.textShadow!==t&&!Ka;if(d)e.textShadow=a=a.replace(/contrast/g,this.renderer.getContrast(b.style.fill));if(sb||f)e.textRendering="geometricPrecision";g?this.css(e):(this.fakeTS=!0,this.ySetter=this.xSetter,c=[].slice.call(b.getElementsByTagName("tspan")),o(a.split(/\s?,\s?/g),function(a){var d=
b.firstChild,e,f,a=a.split(" ");e=a[a.length-1];(f=a[a.length-2])&&o(c,function(a,c){var g;c===0&&(a.setAttribute("x",b.getAttribute("x")),c=b.getAttribute("y"),a.setAttribute("y",c||0),c===null&&b.setAttribute("y",0));g=a.cloneNode(1);X(g,{"class":"highcharts-text-shadow",fill:e,stroke:e,"stroke-opacity":1/w(K(f),3),"stroke-width":f,"stroke-linejoin":"round"});b.insertBefore(g,d)})}))},attr:function(a,b,c){var d,e=this.element,f,g=this,h;typeof a==="string"&&b!==t&&(d=a,a={},a[d]=b);if(typeof a===
"string")g=(this[a+"Getter"]||this._defaultGetter).call(this,a,e);else{for(d in a){b=a[d];h=!1;this.symbolName&&/^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)/.test(d)&&(f||(this.symbolAttr(a),f=!0),h=!0);if(this.rotation&&(d==="x"||d==="y"))this.doTransform=!0;h||(h=this[d+"Setter"]||this._defaultSetter,h.call(this,b,d,e),this.shadows&&/^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(d)&&this.updateShadows(d,b,h))}if(this.doTransform)this.updateTransform(),this.doTransform=!1}c&&
c();return g},updateShadows:function(a,b,c){for(var d=this.shadows,e=d.length;e--;)c.call(d[e],a==="height"?Math.max(b-(d[e].cutHeight||0),0):a==="d"?this.d:b,a,d[e])},addClass:function(a){var b=this.element,c=X(b,"class")||"";c.indexOf(a)===-1&&X(b,"class",c+" "+a);return this},symbolAttr:function(a){var b=this;o("x,y,r,start,end,width,height,innerR,anchorX,anchorY".split(","),function(c){b[c]=q(a[c],b[c])});b.attr({d:b.renderer.symbols[b.symbolName](b.x,b.y,b.width,b.height,b)})},clip:function(a){return this.attr("clip-path",
a?"url("+this.renderer.url+"#"+a.id+")":"none")},crisp:function(a){var b,c={},d,e=this.strokeWidth||0;d=y(e)%2/2;a.x=V(a.x||this.x||0)+d;a.y=V(a.y||this.y||0)+d;a.width=V((a.width||this.width||0)-2*d);a.height=V((a.height||this.height||0)-2*d);a.strokeWidth=e;for(b in a)this[b]!==a[b]&&(this[b]=c[b]=a[b]);return c},css:function(a){var b=this.styles,c={},d=this.element,e,f,g="";e=!b;if(a&&a.color)a.fill=a.color;if(b)for(f in a)a[f]!==b[f]&&(c[f]=a[f],e=!0);if(e){e=this.textWidth=a&&a.width&&d.nodeName.toLowerCase()===
"text"&&K(a.width)||this.textWidth;b&&(a=A(b,c));this.styles=a;e&&(qa||!ja&&this.renderer.forExport)&&delete a.width;if(Ka&&!ja)N(this.element,a);else{b=function(a,b){return"-"+b.toLowerCase()};for(f in a)g+=f.replace(/([A-Z])/g,b)+":"+a[f]+";";X(d,"style",g)}e&&this.added&&this.renderer.buildText(this)}return this},on:function(a,b){var c=this,d=c.element;cb&&a==="click"?(d.ontouchstart=function(a){c.touchEventFired=ba.now();a.preventDefault();b.call(d,a)},d.onclick=function(a){(Na.indexOf("Android")===
-1||ba.now()-(c.touchEventFired||0)>1100)&&b.call(d,a)}):d["on"+a]=b;return this},setRadialReference:function(a){var b=this.renderer.gradients[this.element.gradient];this.element.radialReference=a;b&&b.radAttr&&b.animate(this.renderer.getRadialAttr(a,b.radAttr));return this},translate:function(a,b){return this.attr({translateX:a,translateY:b})},invert:function(){this.inverted=!0;this.updateTransform();return this},updateTransform:function(){var a=this.translateX||0,b=this.translateY||0,c=this.scaleX,
d=this.scaleY,e=this.inverted,f=this.rotation,g=this.element;e&&(a+=this.attr("width"),b+=this.attr("height"));a=["translate("+a+","+b+")"];e?a.push("rotate(90) scale(-1,1)"):f&&a.push("rotate("+f+" "+(g.getAttribute("x")||0)+" "+(g.getAttribute("y")||0)+")");(v(c)||v(d))&&a.push("scale("+q(c,1)+" "+q(d,1)+")");a.length&&g.setAttribute("transform",a.join(" "))},toFront:function(){var a=this.element;a.parentNode.appendChild(a);return this},align:function(a,b,c){var d,e,f,g,h={};e=this.renderer;f=e.alignedObjects;
if(a){if(this.alignOptions=a,this.alignByTranslate=b,!c||Ca(c))this.alignTo=d=c||"renderer",za(f,this),f.push(this),c=null}else a=this.alignOptions,b=this.alignByTranslate,d=this.alignTo;c=q(c,e[d],e);d=a.align;e=a.verticalAlign;f=(c.x||0)+(a.x||0);g=(c.y||0)+(a.y||0);if(d==="right"||d==="center")f+=(c.width-(a.width||0))/{right:1,center:2}[d];h[b?"translateX":"x"]=y(f);if(e==="bottom"||e==="middle")g+=(c.height-(a.height||0))/({bottom:1,middle:2}[e]||1);h[b?"translateY":"y"]=y(g);this[this.placed?
"animate":"attr"](h);this.placed=!0;this.alignAttr=h;return this},getBBox:function(a,b){var c,d=this.renderer,e,f,g,h=this.element,i=this.styles;e=this.textStr;var j,k=h.style,l,m=d.cache,n=d.cacheKeys,p;f=q(b,this.rotation);g=f*pa;e!==t&&(p=["",f||0,i&&i.fontSize,h.style.width].join(","),p=e===""||$b.test(e)?"num:"+e.toString().length+p:e+p);p&&!a&&(c=m[p]);if(!c){if(h.namespaceURI===Qa||d.forExport){try{l=this.fakeTS&&function(a){o(h.querySelectorAll(".highcharts-text-shadow"),function(b){b.style.display=
a})},Wa&&k.textShadow?(j=k.textShadow,k.textShadow=""):l&&l("none"),c=h.getBBox?A({},h.getBBox()):{width:h.offsetWidth,height:h.offsetHeight},j?k.textShadow=j:l&&l("")}catch(r){}if(!c||c.width<0)c={width:0,height:0}}else c=this.htmlGetBBox();if(d.isSVG){d=c.width;e=c.height;if(Ka&&i&&i.fontSize==="11px"&&e.toPrecision(3)==="16.9")c.height=e=14;if(f)c.width=S(e*la(g))+S(d*ca(g)),c.height=S(e*ca(g))+S(d*la(g))}if(p){for(;n.length>250;)delete m[n.shift()];m[p]||n.push(p);m[p]=c}}return c},show:function(a){return this.attr({visibility:a?
"inherit":"visible"})},hide:function(){return this.attr({visibility:"hidden"})},fadeOut:function(a){var b=this;b.animate({opacity:0},{duration:a||150,complete:function(){b.attr({y:-9999})}})},add:function(a){var b=this.renderer,c=this.element,d;if(a)this.parentGroup=a;this.parentInverted=a&&a.inverted;this.textStr!==void 0&&b.buildText(this);this.added=!0;if(!a||a.handleZ||this.zIndex)d=this.zIndexSetter();d||(a?a.element:b.box).appendChild(c);if(this.onAdd)this.onAdd();return this},safeRemoveChild:function(a){var b=
a.parentNode;b&&b.removeChild(a)},destroy:function(){var a=this,b=a.element||{},c=a.shadows,d=a.renderer.isSVG&&b.nodeName==="SPAN"&&a.parentGroup,e,f;b.onclick=b.onmouseout=b.onmouseover=b.onmousemove=b.point=null;Sa(a);if(a.clipPath)a.clipPath=a.clipPath.destroy();if(a.stops){for(f=0;f<a.stops.length;f++)a.stops[f]=a.stops[f].destroy();a.stops=null}a.safeRemoveChild(b);for(c&&o(c,function(b){a.safeRemoveChild(b)});d&&d.div&&d.div.childNodes.length===0;)b=d.parentGroup,a.safeRemoveChild(d.div),delete d.div,
d=b;a.alignTo&&za(a.renderer.alignedObjects,a);for(e in a)delete a[e];return null},shadow:function(a,b,c){var d=[],e,f,g=this.element,h,i,j,k;if(a){i=q(a.width,3);j=(a.opacity||0.15)/i;k=this.parentInverted?"(-1,-1)":"("+q(a.offsetX,1)+", "+q(a.offsetY,1)+")";for(e=1;e<=i;e++){f=g.cloneNode(0);h=i*2+1-2*e;X(f,{isShadow:"true",stroke:a.color||"black","stroke-opacity":j*e,"stroke-width":h,transform:"translate"+k,fill:"none"});if(c)X(f,"height",w(X(f,"height")-h,0)),f.cutHeight=h;b?b.element.appendChild(f):
g.parentNode.insertBefore(f,g);d.push(f)}this.shadows=d}return this},xGetter:function(a){this.element.nodeName==="circle"&&(a={x:"cx",y:"cy"}[a]||a);return this._defaultGetter(a)},_defaultGetter:function(a){a=q(this[a],this.element?this.element.getAttribute(a):null,0);/^[\-0-9\.]+$/.test(a)&&(a=parseFloat(a));return a},dSetter:function(a,b,c){a&&a.join&&(a=a.join(" "));/(NaN| {2}|^$)/.test(a)&&(a="M 0 0");c.setAttribute(b,a);this[b]=a},dashstyleSetter:function(a){var b,c=this["stroke-width"];c===
"inherit"&&(c=1);if(a=a&&a.toLowerCase()){a=a.replace("shortdashdotdot","3,1,1,1,1,1,").replace("shortdashdot","3,1,1,1").replace("shortdot","1,1,").replace("shortdash","3,1,").replace("longdash","8,3,").replace(/dot/g,"1,3,").replace("dash","4,3,").replace(/,$/,"").split(",");for(b=a.length;b--;)a[b]=K(a[b])*c;a=a.join(",").replace(/NaN/g,"none");this.element.setAttribute("stroke-dasharray",a)}},alignSetter:function(a){this.element.setAttribute("text-anchor",{left:"start",center:"middle",right:"end"}[a])},
opacitySetter:function(a,b,c){this[b]=a;c.setAttribute(b,a)},titleSetter:function(a){var b=this.element.getElementsByTagName("title")[0];b||(b=H.createElementNS(Qa,"title"),this.element.appendChild(b));b.firstChild&&b.removeChild(b.firstChild);b.appendChild(H.createTextNode(String(q(a),"").replace(/<[^>]*>/g,"")))},textSetter:function(a){if(a!==this.textStr)delete this.bBox,this.textStr=a,this.added&&this.renderer.buildText(this)},fillSetter:function(a,b,c){typeof a==="string"?c.setAttribute(b,a):
a&&this.colorGradient(a,b,c)},visibilitySetter:function(a,b,c){a==="inherit"?c.removeAttribute(b):c.setAttribute(b,a)},zIndexSetter:function(a,b){var c=this.renderer,d=this.parentGroup,c=(d||c).element||c.box,e,f,g=this.element,h;e=this.added;var i;if(v(a))g.zIndex=a,a=+a,this[b]===a&&(e=!1),this[b]=a;if(e){if((a=this.zIndex)&&d)d.handleZ=!0;d=c.childNodes;for(i=0;i<d.length&&!h;i++)if(e=d[i],f=e.zIndex,e!==g&&(K(f)>a||!v(a)&&v(f)))c.insertBefore(g,e),h=!0;h||c.appendChild(g)}return h},_defaultSetter:function(a,
b,c){c.setAttribute(b,a)}};Z.prototype.yGetter=Z.prototype.xGetter;Z.prototype.translateXSetter=Z.prototype.translateYSetter=Z.prototype.rotationSetter=Z.prototype.verticalAlignSetter=Z.prototype.scaleXSetter=Z.prototype.scaleYSetter=function(a,b){this[b]=a;this.doTransform=!0};Z.prototype["stroke-widthSetter"]=Z.prototype.strokeSetter=function(a,b,c){this[b]=a;if(this.stroke&&this["stroke-width"])this.strokeWidth=this["stroke-width"],Z.prototype.fillSetter.call(this,this.stroke,"stroke",c),c.setAttribute("stroke-width",
this["stroke-width"]),this.hasStroke=!0;else if(b==="stroke-width"&&a===0&&this.hasStroke)c.removeAttribute("stroke"),this.hasStroke=!1};var xa=function(){this.init.apply(this,arguments)};xa.prototype={Element:Z,init:function(a,b,c,d,e,f){var g,d=this.createElement("svg").attr({version:"1.1"}).css(this.getStyle(d));g=d.element;a.appendChild(g);a.innerHTML.indexOf("xmlns")===-1&&X(g,"xmlns",Qa);this.isSVG=!0;this.box=g;this.boxWrapper=d;this.alignedObjects=[];this.url=(Wa||sb)&&H.getElementsByTagName("base").length?
L.location.href.replace(/#.*?$/,"").replace(/([\('\)])/g,"\\$1").replace(/ /g,"%20"):"";this.createElement("desc").add().element.appendChild(H.createTextNode("Created with Highstock 4.2.5"));this.defs=this.createElement("defs").add();this.allowHTML=f;this.forExport=e;this.gradients={};this.cache={};this.cacheKeys=[];this.imgCount=0;this.setSize(b,c,!1);var h;if(Wa&&a.getBoundingClientRect)this.subPixelFix=b=function(){N(a,{left:0,top:0});h=a.getBoundingClientRect();N(a,{left:Ea(h.left)-h.left+"px",
top:Ea(h.top)-h.top+"px"})},b(),E(L,"resize",b)},getStyle:function(a){return this.style=A({fontFamily:'"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif',fontSize:"12px"},a)},isHidden:function(){return!this.boxWrapper.getBBox().width},destroy:function(){var a=this.defs;this.box=null;this.boxWrapper=this.boxWrapper.destroy();Pa(this.gradients||{});this.gradients=null;if(a)this.defs=a.destroy();this.subPixelFix&&T(L,"resize",this.subPixelFix);return this.alignedObjects=null},createElement:function(a){var b=
new this.Element;b.init(this,a);return b},draw:function(){},getRadialAttr:function(a,b){return{cx:a[0]-a[2]/2+b.cx*a[2],cy:a[1]-a[2]/2+b.cy*a[2],r:b.r*a[2]}},buildText:function(a){for(var b=a.element,c=this,d=c.forExport,e=q(a.textStr,"").toString(),f=e.indexOf("<")!==-1,g=b.childNodes,h,i,j,k=X(b,"x"),l=a.styles,m=a.textWidth,n=l&&l.lineHeight,p=l&&l.textShadow,r=l&&l.textOverflow==="ellipsis",s=g.length,F=m&&!a.added&&this.box,u=function(a){return n?K(n):c.fontMetrics(/(px|em)$/.test(a&&a.style.fontSize)?
a.style.fontSize:l&&l.fontSize||c.style.fontSize||12,a).h},x=function(a){return a.replace(/&lt;/g,"<").replace(/&gt;/g,">")};s--;)b.removeChild(g[s]);!f&&!p&&!r&&e.indexOf(" ")===-1?b.appendChild(H.createTextNode(x(e))):(h=/<.*style="([^"]+)".*>/,i=/<.*href="(http[^"]+)".*>/,F&&F.appendChild(b),e=f?e.replace(/<(b|strong)>/g,'<span style="font-weight:bold">').replace(/<(i|em)>/g,'<span style="font-style:italic">').replace(/<a/g,"<span").replace(/<\/(b|strong|i|em|a)>/g,"</span>").split(/<br.*?>/g):
[e],e=Fa(e,function(a){return a!==""}),o(e,function(e,f){var g,n=0,e=e.replace(/^\s+|\s+$/g,"").replace(/<span/g,"|||<span").replace(/<\/span>/g,"</span>|||");g=e.split("|||");o(g,function(e){if(e!==""||g.length===1){var p={},s=H.createElementNS(Qa,"tspan"),F;h.test(e)&&(F=e.match(h)[1].replace(/(;| |^)color([ :])/,"$1fill$2"),X(s,"style",F));i.test(e)&&!d&&(X(s,"onclick",'location.href="'+e.match(i)[1]+'"'),N(s,{cursor:"pointer"}));e=x(e.replace(/<(.|\n)*?>/g,"")||" ");if(e!==" "){s.appendChild(H.createTextNode(e));
if(n)p.dx=0;else if(f&&k!==null)p.x=k;X(s,p);b.appendChild(s);!n&&f&&(!ja&&d&&N(s,{display:"block"}),X(s,"dy",u(s)));if(m){for(var p=e.replace(/([^\^])-/g,"$1- ").split(" "),q=g.length>1||f||p.length>1&&l.whiteSpace!=="nowrap",o,D,v=[],w=u(s),t=1,y=a.rotation,A=e,B=A.length;(q||r)&&(p.length||v.length);)a.rotation=0,o=a.getBBox(!0),D=o.width,!ja&&c.forExport&&(D=c.measureSpanWidth(s.firstChild.data,a.styles)),o=D>m,j===void 0&&(j=o),r&&j?(B/=2,A===""||!o&&B<0.5?p=[]:(A=e.substring(0,A.length+(o?-1:
1)*Ea(B)),p=[A+(m>3?"\u2026":"")],s.removeChild(s.firstChild))):!o||p.length===1?(p=v,v=[],p.length&&(t++,s=H.createElementNS(Qa,"tspan"),X(s,{dy:w,x:k}),F&&X(s,"style",F),b.appendChild(s)),D>m&&(m=D)):(s.removeChild(s.firstChild),v.unshift(p.pop())),p.length&&s.appendChild(H.createTextNode(p.join(" ").replace(/- /g,"-")));a.rotation=y}n++}}})}),j&&a.attr("title",a.textStr),F&&F.removeChild(b),p&&a.applyTextShadow&&a.applyTextShadow(p))},getContrast:function(a){a=va(a).rgba;return a[0]+a[1]+a[2]>
384?"#000000":"#FFFFFF"},button:function(a,b,c,d,e,f,g,h,i){var j=this.label(a,b,c,i,null,null,null,null,"button"),k=0,l,m,n,p,r,s,a={x1:0,y1:0,x2:0,y2:1},e=z({"stroke-width":1,stroke:"#CCCCCC",fill:{linearGradient:a,stops:[[0,"#FEFEFE"],[1,"#F6F6F6"]]},r:2,padding:5,style:{color:"black"}},e);n=e.style;delete e.style;f=z(e,{stroke:"#68A",fill:{linearGradient:a,stops:[[0,"#FFF"],[1,"#ACF"]]}},f);p=f.style;delete f.style;g=z(e,{stroke:"#68A",fill:{linearGradient:a,stops:[[0,"#9BD"],[1,"#CDF"]]}},g);
r=g.style;delete g.style;h=z(e,{style:{color:"#CCC"}},h);s=h.style;delete h.style;E(j.element,Ka?"mouseover":"mouseenter",function(){k!==3&&j.attr(f).css(p)});E(j.element,Ka?"mouseout":"mouseleave",function(){k!==3&&(l=[e,f,g][k],m=[n,p,r][k],j.attr(l).css(m))});j.setState=function(a){(j.state=k=a)?a===2?j.attr(g).css(r):a===3&&j.attr(h).css(s):j.attr(e).css(n)};return j.on("click",function(a){k!==3&&d.call(j,a)}).attr(e).css(A({cursor:"default"},n))},crispLine:function(a,b){a[1]===a[4]&&(a[1]=a[4]=
y(a[1])-b%2/2);a[2]===a[5]&&(a[2]=a[5]=y(a[2])+b%2/2);return a},path:function(a){var b={fill:"none"};Ja(a)?b.d=a:ea(a)&&A(b,a);return this.createElement("path").attr(b)},circle:function(a,b,c){a=ea(a)?a:{x:a,y:b,r:c};b=this.createElement("circle");b.xSetter=b.ySetter=function(a,b,c){c.setAttribute("c"+b,a)};return b.attr(a)},arc:function(a,b,c,d,e,f){if(ea(a))b=a.y,c=a.r,d=a.innerR,e=a.start,f=a.end,a=a.x;a=this.symbol("arc",a||0,b||0,c||0,c||0,{innerR:d||0,start:e||0,end:f||0});a.r=c;return a},rect:function(a,
b,c,d,e,f){var e=ea(a)?a.r:e,g=this.createElement("rect"),a=ea(a)?a:a===t?{}:{x:a,y:b,width:w(c,0),height:w(d,0)};if(f!==t)g.strokeWidth=f,a=g.crisp(a);if(e)a.r=e;g.rSetter=function(a,b,c){X(c,{rx:a,ry:a})};return g.attr(a)},setSize:function(a,b,c){var d=this.alignedObjects,e=d.length;this.width=a;this.height=b;for(this.boxWrapper[q(c,!0)?"animate":"attr"]({width:a,height:b});e--;)d[e].align()},g:function(a){var b=this.createElement("g");return v(a)?b.attr({"class":"highcharts-"+a}):b},image:function(a,
b,c,d,e){var f={preserveAspectRatio:"none"};arguments.length>1&&A(f,{x:b,y:c,width:d,height:e});f=this.createElement("image").attr(f);f.element.setAttributeNS?f.element.setAttributeNS("http://www.w3.org/1999/xlink","href",a):f.element.setAttribute("hc-svg-href",a);return f},symbol:function(a,b,c,d,e,f){var g=this,h,i=this.symbols[a],i=i&&i(y(b),y(c),d,e,f),j=/^url\((.*?)\)$/,k,l;if(i)h=this.path(i),A(h,{symbolName:a,x:b,y:c,width:d,height:e}),f&&A(h,f);else if(j.test(a))l=function(a,b){a.element&&
(a.attr({width:b[0],height:b[1]}),a.alignByTranslate||a.translate(y((d-b[0])/2),y((e-b[1])/2)))},k=a.match(j)[1],a=Vb[k]||f&&f.width&&f.height&&[f.width,f.height],h=this.image(k).attr({x:b,y:c}),h.isImg=!0,a?l(h,a):(h.attr({width:0,height:0}),fa("img",{onload:function(){this.width===0&&(N(this,{position:"absolute",top:"-999em"}),H.body.appendChild(this));l(h,Vb[k]=[this.width,this.height]);this.parentNode&&this.parentNode.removeChild(this);g.imgCount--;if(!g.imgCount&&$[g.chartIndex].onload)$[g.chartIndex].onload()},
src:k}),this.imgCount++);return h},symbols:{circle:function(a,b,c,d){var e=0.166*c;return["M",a+c/2,b,"C",a+c+e,b,a+c+e,b+d,a+c/2,b+d,"C",a-e,b+d,a-e,b,a+c/2,b,"Z"]},square:function(a,b,c,d){return["M",a,b,"L",a+c,b,a+c,b+d,a,b+d,"Z"]},triangle:function(a,b,c,d){return["M",a+c/2,b,"L",a+c,b+d,a,b+d,"Z"]},"triangle-down":function(a,b,c,d){return["M",a,b,"L",a+c,b,a+c/2,b+d,"Z"]},diamond:function(a,b,c,d){return["M",a+c/2,b,"L",a+c,b+d/2,a+c/2,b+d,a,b+d/2,"Z"]},arc:function(a,b,c,d,e){var f=e.start,
c=e.r||c||d,g=e.end-0.001,d=e.innerR,h=e.open,i=ca(f),j=la(f),k=ca(g),g=la(g),e=e.end-f<Aa?0:1;return["M",a+c*i,b+c*j,"A",c,c,0,e,1,a+c*k,b+c*g,h?"M":"L",a+d*k,b+d*g,"A",d,d,0,e,0,a+d*i,b+d*j,h?"":"Z"]},callout:function(a,b,c,d,e){var f=G(e&&e.r||0,c,d),g=f+6,h=e&&e.anchorX,e=e&&e.anchorY,i;i=["M",a+f,b,"L",a+c-f,b,"C",a+c,b,a+c,b,a+c,b+f,"L",a+c,b+d-f,"C",a+c,b+d,a+c,b+d,a+c-f,b+d,"L",a+f,b+d,"C",a,b+d,a,b+d,a,b+d-f,"L",a,b+f,"C",a,b,a,b,a+f,b];h&&h>c&&e>b+g&&e<b+d-g?i.splice(13,3,"L",a+c,e-6,a+
c+6,e,a+c,e+6,a+c,b+d-f):h&&h<0&&e>b+g&&e<b+d-g?i.splice(33,3,"L",a,e+6,a-6,e,a,e-6,a,b+f):e&&e>d&&h>a+g&&h<a+c-g?i.splice(23,3,"L",h+6,b+d,h,b+d+6,h-6,b+d,a+f,b+d):e&&e<0&&h>a+g&&h<a+c-g&&i.splice(3,3,"L",h-6,b,h,b-6,h+6,b,c-f,b);return i}},clipRect:function(a,b,c,d){var e="highcharts-"+Ib++,f=this.createElement("clipPath").attr({id:e}).add(this.defs),a=this.rect(a,b,c,d,0).add(f);a.id=e;a.clipPath=f;a.count=0;return a},text:function(a,b,c,d){var e=qa||!ja&&this.forExport,f={};if(d&&(this.allowHTML||
!this.forExport))return this.html(a,b,c);f.x=Math.round(b||0);if(c)f.y=Math.round(c);if(a||a===0)f.text=a;a=this.createElement("text").attr(f);e&&a.css({position:"absolute"});if(!d)a.xSetter=function(a,b,c){var d=c.getElementsByTagName("tspan"),e,f=c.getAttribute(b),m;for(m=0;m<d.length;m++)e=d[m],e.getAttribute(b)===f&&e.setAttribute(b,a);c.setAttribute(b,a)};return a},fontMetrics:function(a,b){var c,d,a=a||this.style.fontSize;!a&&b&&L.getComputedStyle&&(b=b.element||b,a=(c=L.getComputedStyle(b,
""))&&c.fontSize);a=/px/.test(a)?K(a):/em/.test(a)?parseFloat(a)*12:12;c=a<24?a+3:y(a*1.2);d=y(c*0.8);return{h:c,b:d,f:a}},rotCorr:function(a,b,c){var d=a;b&&c&&(d=w(d*ca(b*pa),4));return{x:-a/3*la(b*pa),y:d}},label:function(a,b,c,d,e,f,g,h,i){var j=this,k=j.g(i),l=j.text("",0,0,g).attr({zIndex:1}),m,n,p=0,r=3,s=0,F,u,q,D,Q=0,ha={},w,B,Kb,G,C;Kb=function(){var a,b;a=l.element.style;n=(F===void 0||u===void 0||k.styles.textAlign)&&v(l.textStr)&&l.getBBox();k.width=(F||n.width||0)+2*r+s;k.height=(u||
n.height||0)+2*r;w=r+j.fontMetrics(a&&a.fontSize,l).b;if(B){if(!m)a=Q,b=(h?-w:0)+Q,k.box=m=d?j.symbol(d,a,b,k.width,k.height,ha):j.rect(a,b,k.width,k.height,0,ha["stroke-width"]),m.isImg||m.attr("fill","none"),m.add(k);m.isImg||m.attr(A({width:y(k.width),height:y(k.height)},ha));ha=null}};G=function(){var a=k.styles,a=a&&a.textAlign,b=s+r,c;c=h?0:w;if(v(F)&&n&&(a==="center"||a==="right"))b+={center:0.5,right:1}[a]*(F-n.width);if(b!==l.x||c!==l.y)l.attr("x",b),c!==t&&l.attr("y",c);l.x=b;l.y=c};C=function(a,
b){m?m.attr(a,b):ha[a]=b};k.onAdd=function(){l.add(k);k.attr({text:a||a===0?a:"",x:b,y:c});m&&v(e)&&k.attr({anchorX:e,anchorY:f})};k.widthSetter=function(a){F=a};k.heightSetter=function(a){u=a};k.paddingSetter=function(a){if(v(a)&&a!==r)r=k.padding=a,G()};k.paddingLeftSetter=function(a){v(a)&&a!==s&&(s=a,G())};k.alignSetter=function(a){a={left:0,center:0.5,right:1}[a];a!==p&&(p=a,n&&k.attr({x:q}))};k.textSetter=function(a){a!==t&&l.textSetter(a);Kb();G()};k["stroke-widthSetter"]=function(a,b){a&&
(B=!0);Q=a%2/2;C(b,a)};k.strokeSetter=k.fillSetter=k.rSetter=function(a,b){b==="fill"&&a&&(B=!0);C(b,a)};k.anchorXSetter=function(a,b){e=a;C(b,y(a)-Q-q)};k.anchorYSetter=function(a,b){f=a;C(b,a-D)};k.xSetter=function(a){k.x=a;p&&(a-=p*((F||n.width)+2*r));q=y(a);k.attr("translateX",q)};k.ySetter=function(a){D=k.y=y(a);k.attr("translateY",D)};var H=k.css;return A(k,{css:function(a){if(a){var b={},a=z(a);o(k.textProps,function(c){a[c]!==t&&(b[c]=a[c],delete a[c])});l.css(b)}return H.call(k,a)},getBBox:function(){return{width:n.width+
2*r,height:n.height+2*r,x:n.x-r,y:n.y-r}},shadow:function(a){m&&m.shadow(a);return k},destroy:function(){T(k.element,"mouseenter");T(k.element,"mouseleave");l&&(l=l.destroy());m&&(m=m.destroy());Z.prototype.destroy.call(k);k=j=Kb=G=C=null}})}};Xa=xa;A(Z.prototype,{htmlCss:function(a){var b=this.element;if(b=a&&b.tagName==="SPAN"&&a.width)delete a.width,this.textWidth=b,this.updateTransform();if(a&&a.textOverflow==="ellipsis")a.whiteSpace="nowrap",a.overflow="hidden";this.styles=A(this.styles,a);N(this.element,
a);return this},htmlGetBBox:function(){var a=this.element;if(a.nodeName==="text")a.style.position="absolute";return{x:a.offsetLeft,y:a.offsetTop,width:a.offsetWidth,height:a.offsetHeight}},htmlUpdateTransform:function(){if(this.added){var a=this.renderer,b=this.element,c=this.translateX||0,d=this.translateY||0,e=this.x||0,f=this.y||0,g=this.textAlign||"left",h={left:0,center:0.5,right:1}[g],i=this.shadows,j=this.styles;N(b,{marginLeft:c,marginTop:d});i&&o(i,function(a){N(a,{marginLeft:c+1,marginTop:d+
1})});this.inverted&&o(b.childNodes,function(c){a.invertChild(c,b)});if(b.tagName==="SPAN"){var i=this.rotation,k=K(this.textWidth),l=j&&j.whiteSpace,m=[i,g,b.innerHTML,this.textWidth,this.textAlign].join(",");if(m!==this.cTT){j=a.fontMetrics(b.style.fontSize).b;v(i)&&this.setSpanRotation(i,h,j);if(b.offsetWidth>k&&/[ \-]/.test(b.textContent||b.innerText))N(b,{width:k+"px",display:"block",whiteSpace:l||"normal"}),this.hasTextWidth=!0;else if(this.hasTextWidth)N(b,{width:"",display:"",whiteSpace:l||
"nowrap"}),this.hasTextWidth=!1;this.getSpanCorrection(this.hasTextWidth?k:b.offsetWidth,j,h,i,g)}N(b,{left:e+(this.xCorr||0)+"px",top:f+(this.yCorr||0)+"px"});if(sb)j=b.offsetHeight;this.cTT=m}}else this.alignOnAdd=!0},setSpanRotation:function(a,b,c){var d={},e=Ka?"-ms-transform":sb?"-webkit-transform":Wa?"MozTransform":Ub?"-o-transform":"";d[e]=d.transform="rotate("+a+"deg)";d[e+(Wa?"Origin":"-origin")]=d.transformOrigin=b*100+"% "+c+"px";N(this.element,d)},getSpanCorrection:function(a,b,c){this.xCorr=
-a*c;this.yCorr=-b}});A(xa.prototype,{html:function(a,b,c){var d=this.createElement("span"),e=d.element,f=d.renderer,g=f.isSVG,h=function(a,b){o(["opacity","visibility"],function(c){U(a,c+"Setter",function(a,c,d,e){a.call(this,c,d,e);b[d]=c})})};d.textSetter=function(a){a!==e.innerHTML&&delete this.bBox;e.innerHTML=this.textStr=a;d.htmlUpdateTransform()};g&&h(d,d.element.style);d.xSetter=d.ySetter=d.alignSetter=d.rotationSetter=function(a,b){b==="align"&&(b="textAlign");d[b]=a;d.htmlUpdateTransform()};
d.attr({text:a,x:y(b),y:y(c)}).css({position:"absolute",fontFamily:this.style.fontFamily,fontSize:this.style.fontSize});e.style.whiteSpace="nowrap";d.css=d.htmlCss;if(g)d.add=function(a){var b,c=f.box.parentNode,g=[];if(this.parentGroup=a){if(b=a.div,!b){for(;a;)g.push(a),a=a.parentGroup;o(g.reverse(),function(a){var d,e=X(a.element,"class");e&&(e={className:e});b=a.div=a.div||fa(Va,e,{position:"absolute",left:(a.translateX||0)+"px",top:(a.translateY||0)+"px",opacity:a.opacity},b||c);d=b.style;A(a,
{translateXSetter:function(b,c){d.left=b+"px";a[c]=b;a.doTransform=!0},translateYSetter:function(b,c){d.top=b+"px";a[c]=b;a.doTransform=!0}});h(a,d)})}}else b=c;b.appendChild(e);d.added=!0;d.alignOnAdd&&d.htmlUpdateTransform();return d};return d}});var lb,aa;if(!ja&&!qa)aa={init:function(a,b){var c=["<",b,' filled="f" stroked="f"'],d=["position: ","absolute",";"],e=b===Va;(b==="shape"||e)&&d.push("left:0;top:0;width:1px;height:1px;");d.push("visibility: ",e?"hidden":"visible");c.push(' style="',d.join(""),
'"/>');if(b)c=e||b==="span"||b==="img"?c.join(""):a.prepVML(c),this.element=fa(c);this.renderer=a},add:function(a){var b=this.renderer,c=this.element,d=b.box,e=a&&a.inverted,d=a?a.element||a:d;if(a)this.parentGroup=a;e&&b.invertChild(c,d);d.appendChild(c);this.added=!0;this.alignOnAdd&&!this.deferUpdateTransform&&this.updateTransform();if(this.onAdd)this.onAdd();return this},updateTransform:Z.prototype.htmlUpdateTransform,setSpanRotation:function(){var a=this.rotation,b=ca(a*pa),c=la(a*pa);N(this.element,
{filter:a?["progid:DXImageTransform.Microsoft.Matrix(M11=",b,", M12=",-c,", M21=",c,", M22=",b,", sizingMethod='auto expand')"].join(""):"none"})},getSpanCorrection:function(a,b,c,d,e){var f=d?ca(d*pa):1,g=d?la(d*pa):0,h=q(this.elemHeight,this.element.offsetHeight),i;this.xCorr=f<0&&-a;this.yCorr=g<0&&-h;i=f*g<0;this.xCorr+=g*b*(i?1-c:c);this.yCorr-=f*b*(d?i?c:1-c:1);e&&e!=="left"&&(this.xCorr-=a*c*(f<0?-1:1),d&&(this.yCorr-=h*c*(g<0?-1:1)),N(this.element,{textAlign:e}))},pathToVML:function(a){for(var b=
a.length,c=[];b--;)if(C(a[b]))c[b]=y(a[b]*10)-5;else if(a[b]==="Z")c[b]="x";else if(c[b]=a[b],a.isArc&&(a[b]==="wa"||a[b]==="at"))c[b+5]===c[b+7]&&(c[b+7]+=a[b+7]>a[b+5]?1:-1),c[b+6]===c[b+8]&&(c[b+8]+=a[b+8]>a[b+6]?1:-1);return c.join(" ")||"x"},clip:function(a){var b=this,c;a?(c=a.members,za(c,b),c.push(b),b.destroyClip=function(){za(c,b)},a=a.getCSS(b)):(b.destroyClip&&b.destroyClip(),a={clip:rb?"inherit":"rect(auto)"});return b.css(a)},css:Z.prototype.htmlCss,safeRemoveChild:function(a){a.parentNode&&
Ua(a)},destroy:function(){this.destroyClip&&this.destroyClip();return Z.prototype.destroy.apply(this)},on:function(a,b){this.element["on"+a]=function(){var a=L.event;a.target=a.srcElement;b(a)};return this},cutOffPath:function(a,b){var c,a=a.split(/[ ,]/);c=a.length;if(c===9||c===11)a[c-4]=a[c-2]=K(a[c-2])-10*b;return a.join(" ")},shadow:function(a,b,c){var d=[],e,f=this.element,g=this.renderer,h,i=f.style,j,k=f.path,l,m,n,p;k&&typeof k.value!=="string"&&(k="x");m=k;if(a){n=q(a.width,3);p=(a.opacity||
0.15)/n;for(e=1;e<=3;e++){l=n*2+1-2*e;c&&(m=this.cutOffPath(k.value,l+0.5));j=['<shape isShadow="true" strokeweight="',l,'" filled="false" path="',m,'" coordsize="10 10" style="',f.style.cssText,'" />'];h=fa(g.prepVML(j),null,{left:K(i.left)+q(a.offsetX,1),top:K(i.top)+q(a.offsetY,1)});if(c)h.cutOff=l+1;j=['<stroke color="',a.color||"black",'" opacity="',p*e,'"/>'];fa(g.prepVML(j),null,null,h);b?b.element.appendChild(h):f.parentNode.insertBefore(h,f);d.push(h)}this.shadows=d}return this},updateShadows:ra,
setAttr:function(a,b){rb?this.element[a]=b:this.element.setAttribute(a,b)},classSetter:function(a){this.element.className=a},dashstyleSetter:function(a,b,c){(c.getElementsByTagName("stroke")[0]||fa(this.renderer.prepVML(["<stroke/>"]),null,null,c))[b]=a||"solid";this[b]=a},dSetter:function(a,b,c){var d=this.shadows,a=a||[];this.d=a.join&&a.join(" ");c.path=a=this.pathToVML(a);if(d)for(c=d.length;c--;)d[c].path=d[c].cutOff?this.cutOffPath(a,d[c].cutOff):a;this.setAttr(b,a)},fillSetter:function(a,b,
c){var d=c.nodeName;if(d==="SPAN")c.style.color=a;else if(d!=="IMG")c.filled=a!=="none",this.setAttr("fillcolor",this.renderer.color(a,c,b,this))},"fill-opacitySetter":function(a,b,c){fa(this.renderer.prepVML(["<",b.split("-")[0],' opacity="',a,'"/>']),null,null,c)},opacitySetter:ra,rotationSetter:function(a,b,c){c=c.style;this[b]=c[b]=a;c.left=-y(la(a*pa)+1)+"px";c.top=y(ca(a*pa))+"px"},strokeSetter:function(a,b,c){this.setAttr("strokecolor",this.renderer.color(a,c,b,this))},"stroke-widthSetter":function(a,
b,c){c.stroked=!!a;this[b]=a;C(a)&&(a+="px");this.setAttr("strokeweight",a)},titleSetter:function(a,b){this.setAttr(b,a)},visibilitySetter:function(a,b,c){a==="inherit"&&(a="visible");this.shadows&&o(this.shadows,function(c){c.style[b]=a});c.nodeName==="DIV"&&(a=a==="hidden"?"-999em":0,rb||(c.style[b]=a?"visible":"hidden"),b="top");c.style[b]=a},xSetter:function(a,b,c){this[b]=a;b==="x"?b="left":b==="y"&&(b="top");this.updateClipping?(this[b]=a,this.updateClipping()):c.style[b]=a},zIndexSetter:function(a,
b,c){c.style[b]=a}},aa["stroke-opacitySetter"]=aa["fill-opacitySetter"],B.VMLElement=aa=ma(Z,aa),aa.prototype.ySetter=aa.prototype.widthSetter=aa.prototype.heightSetter=aa.prototype.xSetter,aa={Element:aa,isIE8:Na.indexOf("MSIE 8.0")>-1,init:function(a,b,c,d){var e;this.alignedObjects=[];d=this.createElement(Va).css(A(this.getStyle(d),{position:"relative"}));e=d.element;a.appendChild(d.element);this.isVML=!0;this.box=e;this.boxWrapper=d;this.gradients={};this.cache={};this.cacheKeys=[];this.imgCount=
0;this.setSize(b,c,!1);if(!H.namespaces.hcv){H.namespaces.add("hcv","urn:schemas-microsoft-com:vml");try{H.createStyleSheet().cssText="hcv\\:fill, hcv\\:path, hcv\\:shape, hcv\\:stroke{ behavior:url(#default#VML); display: inline-block; } "}catch(f){H.styleSheets[0].cssText+="hcv\\:fill, hcv\\:path, hcv\\:shape, hcv\\:stroke{ behavior:url(#default#VML); display: inline-block; } "}}},isHidden:function(){return!this.box.offsetWidth},clipRect:function(a,b,c,d){var e=this.createElement(),f=ea(a);return A(e,
{members:[],count:0,left:(f?a.x:a)+1,top:(f?a.y:b)+1,width:(f?a.width:c)-1,height:(f?a.height:d)-1,getCSS:function(a){var b=a.element,c=b.nodeName,a=a.inverted,d=this.top-(c==="shape"?b.offsetTop:0),e=this.left,b=e+this.width,f=d+this.height,d={clip:"rect("+y(a?e:d)+"px,"+y(a?f:b)+"px,"+y(a?b:f)+"px,"+y(a?d:e)+"px)"};!a&&rb&&c==="DIV"&&A(d,{width:b+"px",height:f+"px"});return d},updateClipping:function(){o(e.members,function(a){a.element&&a.css(e.getCSS(a))})}})},color:function(a,b,c,d){var e=this,
f,g=/^rgba/,h,i,j="none";a&&a.linearGradient?i="gradient":a&&a.radialGradient&&(i="pattern");if(i){var k,l,m=a.linearGradient||a.radialGradient,n,p,r,s,q,u="",a=a.stops,x,D=[],Q=function(){h=['<fill colors="'+D.join(",")+'" opacity="',r,'" o:opacity2="',p,'" type="',i,'" ',u,'focus="100%" method="any" />'];fa(e.prepVML(h),null,null,b)};n=a[0];x=a[a.length-1];n[0]>0&&a.unshift([0,n[1]]);x[0]<1&&a.push([1,x[1]]);o(a,function(a,b){g.test(a[1])?(f=va(a[1]),k=f.get("rgb"),l=f.get("a")):(k=a[1],l=1);D.push(a[0]*
100+"% "+k);b?(r=l,s=k):(p=l,q=k)});if(c==="fill")if(i==="gradient")c=m.x1||m[0]||0,a=m.y1||m[1]||0,n=m.x2||m[2]||0,m=m.y2||m[3]||0,u='angle="'+(90-Y.atan((m-a)/(n-c))*180/Aa)+'"',Q();else{var j=m.r,ha=j*2,v=j*2,w=m.cx,t=m.cy,y=b.radialReference,A,j=function(){y&&(A=d.getBBox(),w+=(y[0]-A.x)/A.width-0.5,t+=(y[1]-A.y)/A.height-0.5,ha*=y[2]/A.width,v*=y[2]/A.height);u='src="'+R.global.VMLRadialGradientURL+'" size="'+ha+","+v+'" origin="0.5,0.5" position="'+w+","+t+'" color2="'+q+'" ';Q()};d.added?j():
d.onAdd=j;j=s}else j=k}else if(g.test(a)&&b.tagName!=="IMG")f=va(a),d[c+"-opacitySetter"](f.get("a"),c,b),j=f.get("rgb");else{j=b.getElementsByTagName(c);if(j.length)j[0].opacity=1,j[0].type="solid";j=a}return j},prepVML:function(a){var b=this.isIE8,a=a.join("");b?(a=a.replace("/>",' xmlns="urn:schemas-microsoft-com:vml" />'),a=a.indexOf('style="')===-1?a.replace("/>",' style="display:inline-block;behavior:url(#default#VML);" />'):a.replace('style="','style="display:inline-block;behavior:url(#default#VML);')):
a=a.replace("<","<hcv:");return a},text:xa.prototype.html,path:function(a){var b={coordsize:"10 10"};Ja(a)?b.d=a:ea(a)&&A(b,a);return this.createElement("shape").attr(b)},circle:function(a,b,c){var d=this.symbol("circle");if(ea(a))c=a.r,b=a.y,a=a.x;d.isCircle=!0;d.r=c;return d.attr({x:a,y:b})},g:function(a){var b;a&&(b={className:"highcharts-"+a,"class":"highcharts-"+a});return this.createElement(Va).attr(b)},image:function(a,b,c,d,e){var f=this.createElement("img").attr({src:a});arguments.length>
1&&f.attr({x:b,y:c,width:d,height:e});return f},createElement:function(a){return a==="rect"?this.symbol(a):xa.prototype.createElement.call(this,a)},invertChild:function(a,b){var c=this,d=b.style,e=a.tagName==="IMG"&&a.style;N(a,{flip:"x",left:K(d.width)-(e?K(e.top):1),top:K(d.height)-(e?K(e.left):1),rotation:-90});o(a.childNodes,function(b){c.invertChild(b,a)})},symbols:{arc:function(a,b,c,d,e){var f=e.start,g=e.end,h=e.r||c||d,c=e.innerR,d=ca(f),i=la(f),j=ca(g),k=la(g);if(g-f===0)return["x"];f=["wa",
a-h,b-h,a+h,b+h,a+h*d,b+h*i,a+h*j,b+h*k];e.open&&!c&&f.push("e","M",a,b);f.push("at",a-c,b-c,a+c,b+c,a+c*j,b+c*k,a+c*d,b+c*i,"x","e");f.isArc=!0;return f},circle:function(a,b,c,d,e){e&&(c=d=2*e.r);e&&e.isCircle&&(a-=c/2,b-=d/2);return["wa",a,b,a+c,b+d,a+c,b+d/2,a+c,b+d/2,"e"]},rect:function(a,b,c,d,e){return xa.prototype.symbols[!v(e)||!e.r?"square":"callout"].call(0,a,b,c,d,e)}}},B.VMLRenderer=lb=function(){this.init.apply(this,arguments)},lb.prototype=z(xa.prototype,aa),Xa=lb;xa.prototype.measureSpanWidth=
function(a,b){var c=H.createElement("span"),d;d=H.createTextNode(a);c.appendChild(d);N(c,b);this.box.appendChild(c);d=c.offsetWidth;Ua(c);return d};var Wb;if(qa)B.CanVGRenderer=aa=function(){Qa="http://www.w3.org/1999/xhtml"},aa.prototype.symbols={},Wb=function(){function a(){var a=b.length,d;for(d=0;d<a;d++)b[d]();b=[]}var b=[];return{push:function(c,d){if(b.length===0){var e=H.getElementsByTagName("head")[0],f=H.createElement("script");f.type="text/javascript";f.src=d;f.onload=a;e.appendChild(f)}b.push(c)}}}(),
Xa=aa;bb.prototype={addLabel:function(){var a=this.axis,b=a.options,c=a.chart,d=a.categories,e=a.names,f=this.pos,g=b.labels,h=a.tickPositions,i=f===h[0],j=f===h[h.length-1],e=d?q(d[f],e[f],f):f,d=this.label,h=h.info,k;a.isDatetimeAxis&&h&&(k=b.dateTimeLabelFormats[h.higherRanks[f]||h.unitName]);this.isFirst=i;this.isLast=j;b=a.labelFormatter.call({axis:a,chart:c,isFirst:i,isLast:j,dateTimeLabelFormat:k,value:a.isLog?ka(a.lin2log(e)):e});v(d)?d&&d.attr({text:b}):(this.labelLength=(this.label=d=v(b)&&
g.enabled?c.renderer.text(b,0,0,g.useHTML).css(z(g.style)).add(a.labelGroup):null)&&d.getBBox().width,this.rotation=0)},getLabelSize:function(){return this.label?this.label.getBBox()[this.axis.horiz?"height":"width"]:0},handleOverflow:function(a){var b=this.axis,c=a.x,d=b.chart.chartWidth,e=b.chart.spacing,f=q(b.labelLeft,G(b.pos,e[3])),e=q(b.labelRight,w(b.pos+b.len,d-e[1])),g=this.label,h=this.rotation,i={left:0,center:0.5,right:1}[b.labelAlign],j=g.getBBox().width,k=b.getSlotWidth(),l=k,m=1,n,
p={};if(h)h<0&&c-i*j<f?n=y(c/ca(h*pa)-f):h>0&&c+i*j>e&&(n=y((d-c)/ca(h*pa)));else if(d=c+(1-i)*j,c-i*j<f?l=a.x+l*(1-i)-f:d>e&&(l=e-a.x+l*i,m=-1),l=G(k,l),l<k&&b.labelAlign==="center"&&(a.x+=m*(k-l-i*(k-G(j,l)))),j>l||b.autoRotation&&g.styles.width)n=l;if(n){p.width=n;if(!b.options.labels.style.textOverflow)p.textOverflow="ellipsis";g.css(p)}},getPosition:function(a,b,c,d){var e=this.axis,f=e.chart,g=d&&f.oldChartHeight||f.chartHeight;return{x:a?e.translate(b+c,null,null,d)+e.transB:e.left+e.offset+
(e.opposite?(d&&f.oldChartWidth||f.chartWidth)-e.right-e.left:0),y:a?g-e.bottom+e.offset-(e.opposite?e.height:0):g-e.translate(b+c,null,null,d)-e.transB}},getLabelPosition:function(a,b,c,d,e,f,g,h){var i=this.axis,j=i.transA,k=i.reversed,l=i.staggerLines,m=i.tickRotCorr||{x:0,y:0},n=e.y;v(n)||(n=i.side===0?c.rotation?-8:-c.getBBox().height:i.side===2?m.y+8:ca(c.rotation*pa)*(m.y-c.getBBox(!1,0).height/2));a=a+e.x+m.x-(f&&d?f*j*(k?-1:1):0);b=b+n-(f&&!d?f*j*(k?1:-1):0);l&&(c=g/(h||1)%l,i.opposite&&
(c=l-c-1),b+=c*(i.labelOffset/l));return{x:a,y:y(b)}},getMarkPath:function(a,b,c,d,e,f){return f.crispLine(["M",a,b,"L",a+(e?0:-c),b+(e?c:0)],d)},render:function(a,b,c){var d=this.axis,e=d.options,f=d.chart.renderer,g=d.horiz,h=this.type,i=this.label,j=this.pos,k=e.labels,l=this.gridLine,m=h?h+"Grid":"grid",n=h?h+"Tick":"tick",p=e[m+"LineWidth"],r=e[m+"LineColor"],s=e[m+"LineDashStyle"],m=d.tickSize(n),n=e[n+"Color"],F=this.mark,u=k.step,o=!0,D=d.tickmarkOffset,Q=this.getPosition(g,j,D,b),ha=Q.x,
Q=Q.y,v=g&&ha===d.pos+d.len||!g&&Q===d.pos?-1:1,c=q(c,1);this.isActive=!0;if(p){j=d.getPlotLinePath(j+D,p*v,b,!0);if(l===t){l={stroke:r,"stroke-width":p};if(s)l.dashstyle=s;if(!h)l.zIndex=1;if(b)l.opacity=0;this.gridLine=l=p?f.path(j).attr(l).add(d.gridGroup):null}if(!b&&l&&j)l[this.isNew?"attr":"animate"]({d:j,opacity:c})}if(m)d.opposite&&(m[0]=-m[0]),h=this.getMarkPath(ha,Q,m[0],m[1]*v,g,f),F?F.animate({d:h,opacity:c}):this.mark=f.path(h).attr({stroke:n,"stroke-width":m[1],opacity:c}).add(d.axisGroup);
if(i&&C(ha))i.xy=Q=this.getLabelPosition(ha,Q,i,g,k,D,a,u),this.isFirst&&!this.isLast&&!q(e.showFirstLabel,1)||this.isLast&&!this.isFirst&&!q(e.showLastLabel,1)?o=!1:g&&!d.isRadial&&!k.step&&!k.rotation&&!b&&c!==0&&this.handleOverflow(Q),u&&a%u&&(o=!1),o&&C(Q.y)?(Q.opacity=c,i[this.isNew?"attr":"animate"](Q),this.isNew=!1):i.attr("y",-9999)},destroy:function(){Pa(this,this.axis)}};B.PlotLineOrBand=function(a,b){this.axis=a;if(b)this.options=b,this.id=b.id};B.PlotLineOrBand.prototype={render:function(){var a=
this,b=a.axis,c=b.horiz,d=a.options,e=d.label,f=a.label,g=d.width,h=d.to,i=d.from,j=v(i)&&v(h),k=d.value,l=d.dashStyle,m=a.svgElem,n=[],p,r=d.color,s=q(d.zIndex,0),F=d.events,u={},o=b.chart.renderer,n=b.log2lin;b.isLog&&(i=n(i),h=n(h),k=n(k));if(g){if(n=b.getPlotLinePath(k,g),u={stroke:r,"stroke-width":g},l)u.dashstyle=l}else if(j){n=b.getPlotBandPath(i,h,d);if(r)u.fill=r;if(d.borderWidth)u.stroke=d.borderColor,u["stroke-width"]=d.borderWidth}else return;u.zIndex=s;if(m)if(n)m.show(),m.animate({d:n});
else{if(m.hide(),f)a.label=f=f.destroy()}else if(n&&n.length&&(a.svgElem=m=o.path(n).attr(u).add(),F))for(p in d=function(b){m.on(b,function(c){F[b].apply(a,[c])})},F)d(p);e&&v(e.text)&&n&&n.length&&b.width>0&&b.height>0&&!n.flat?(e=z({align:c&&j&&"center",x:c?!j&&4:10,verticalAlign:!c&&j&&"middle",y:c?j?16:10:j?6:-4,rotation:c&&!j&&90},e),this.renderLabel(e,n,j,s)):f&&f.hide();return a},renderLabel:function(a,b,c,d){var e=this.label,f=this.axis.chart.renderer;if(!e)e={align:a.textAlign||a.align,
rotation:a.rotation},e.zIndex=d,this.label=e=f.text(a.text,0,0,a.useHTML).attr(e).css(a.style).add();d=[b[1],b[4],c?b[6]:b[1]];b=[b[2],b[5],c?b[7]:b[2]];c=Ma(d);f=Ma(b);e.align(a,!1,{x:c,y:f,width:Da(d)-c,height:Da(b)-f});e.show()},destroy:function(){za(this.axis.plotLinesAndBands,this);delete this.axis;Pa(this)}};var J=B.Axis=function(){this.init.apply(this,arguments)};J.prototype={defaultOptions:{dateTimeLabelFormats:{millisecond:"%H:%M:%S.%L",second:"%H:%M:%S",minute:"%H:%M",hour:"%H:%M",day:"%e. %b",
week:"%e. %b",month:"%b '%y",year:"%Y"},endOnTick:!1,gridLineColor:"#D8D8D8",labels:{enabled:!0,style:{color:"#606060",cursor:"default",fontSize:"11px"},x:0},lineColor:"#C0D0E0",lineWidth:1,minPadding:0.01,maxPadding:0.01,minorGridLineColor:"#E0E0E0",minorGridLineWidth:1,minorTickColor:"#A0A0A0",minorTickLength:2,minorTickPosition:"outside",startOfWeek:1,startOnTick:!1,tickColor:"#C0D0E0",tickLength:10,tickmarkPlacement:"between",tickPixelInterval:100,tickPosition:"outside",title:{align:"middle",
style:{color:"#707070"}},type:"linear"},defaultYAxisOptions:{endOnTick:!0,gridLineWidth:1,tickPixelInterval:72,showLastLabel:!0,labels:{x:-8},lineWidth:0,maxPadding:0.05,minPadding:0.05,startOnTick:!0,title:{rotation:270,text:"Values"},stackLabels:{enabled:!1,formatter:function(){return B.numberFormat(this.total,-1)},style:z(W.line.dataLabels.style,{color:"#000000"})}},defaultLeftAxisOptions:{labels:{x:-15},title:{rotation:270}},defaultRightAxisOptions:{labels:{x:15},title:{rotation:90}},defaultBottomAxisOptions:{labels:{autoRotation:[-45],
x:0},title:{rotation:0}},defaultTopAxisOptions:{labels:{autoRotation:[-45],x:0},title:{rotation:0}},init:function(a,b){var c=b.isX;this.chart=a;this.horiz=a.inverted?!c:c;this.coll=(this.isXAxis=c)?"xAxis":"yAxis";this.opposite=b.opposite;this.side=b.side||(this.horiz?this.opposite?0:2:this.opposite?1:3);this.setOptions(b);var d=this.options,e=d.type;this.labelFormatter=d.labels.formatter||this.defaultLabelFormatter;this.userOptions=b;this.minPixelPadding=0;this.reversed=d.reversed;this.visible=d.visible!==
!1;this.zoomEnabled=d.zoomEnabled!==!1;this.categories=d.categories||e==="category";this.names=this.names||[];this.isLog=e==="logarithmic";this.isDatetimeAxis=e==="datetime";this.isLinked=v(d.linkedTo);this.ticks={};this.labelEdge=[];this.minorTicks={};this.plotLinesAndBands=[];this.alternateBands={};this.len=0;this.minRange=this.userMinRange=d.minRange||d.maxZoom;this.range=d.range;this.offset=d.offset||0;this.stacks={};this.oldStacks={};this.stacksTouched=0;this.min=this.max=null;this.crosshair=
q(d.crosshair,ua(a.options.tooltip.crosshairs)[c?0:1],!1);var f,d=this.options.events;sa(this,a.axes)===-1&&(c&&!this.isColorAxis?a.axes.splice(a.xAxis.length,0,this):a.axes.push(this),a[this.coll].push(this));this.series=this.series||[];if(a.inverted&&c&&this.reversed===t)this.reversed=!0;this.removePlotLine=this.removePlotBand=this.removePlotBandOrLine;for(f in d)E(this,f,d[f]);if(this.isLog)this.val2lin=this.log2lin,this.lin2val=this.lin2log},setOptions:function(a){this.options=z(this.defaultOptions,
this.isXAxis?{}:this.defaultYAxisOptions,[this.defaultTopAxisOptions,this.defaultRightAxisOptions,this.defaultBottomAxisOptions,this.defaultLeftAxisOptions][this.side],z(R[this.coll],a))},defaultLabelFormatter:function(){var a=this.axis,b=this.value,c=a.categories,d=this.dateTimeLabelFormat,e=R.lang.numericSymbols,f=e&&e.length,g,h=a.options.labels.format,a=a.isLog?b:a.tickInterval;if(h)g=La(h,this);else if(c)g=b;else if(d)g=na(d,b);else if(f&&a>=1E3)for(;f--&&g===t;)c=Math.pow(1E3,f+1),a>=c&&b*10%
c===0&&e[f]!==null&&(g=B.numberFormat(b/c,-1)+e[f]);g===t&&(g=S(b)>=1E4?B.numberFormat(b,-1):B.numberFormat(b,-1,t,""));return g},getSeriesExtremes:function(){var a=this,b=a.chart;a.hasVisibleSeries=!1;a.dataMin=a.dataMax=a.threshold=null;a.softThreshold=!a.isXAxis;a.buildStacks&&a.buildStacks();o(a.series,function(c){if(c.visible||!b.options.chart.ignoreHiddenSeries){var d=c.options,e=d.threshold,f;a.hasVisibleSeries=!0;a.isLog&&e<=0&&(e=null);if(a.isXAxis){if(d=c.xData,d.length)c=Ma(d),!C(c)&&!(c instanceof
ba)&&(d=Fa(d,function(a){return C(a)}),c=Ma(d)),a.dataMin=G(q(a.dataMin,d[0]),c),a.dataMax=w(q(a.dataMax,d[0]),Da(d))}else{c.getExtremes();f=c.dataMax;c=c.dataMin;if(v(c)&&v(f))a.dataMin=G(q(a.dataMin,c),c),a.dataMax=w(q(a.dataMax,f),f);if(v(e))a.threshold=e;if(!d.softThreshold||a.isLog)a.softThreshold=!1}}})},translate:function(a,b,c,d,e,f){var g=this.linkedParent||this,h=1,i=0,j=d?g.oldTransA:g.transA,d=d?g.oldMin:g.min,k=g.minPixelPadding,e=(g.isOrdinal||g.isBroken||g.isLog&&e)&&g.lin2val;if(!j)j=
g.transA;if(c)h*=-1,i=g.len;g.reversed&&(h*=-1,i-=h*(g.sector||g.len));b?(a=a*h+i,a-=k,a=a/j+d,e&&(a=g.lin2val(a))):(e&&(a=g.val2lin(a)),f==="between"&&(f=0.5),a=h*(a-d)*j+i+h*k+(C(f)?j*f*g.pointRange:0));return a},toPixels:function(a,b){return this.translate(a,!1,!this.horiz,null,!0)+(b?0:this.pos)},toValue:function(a,b){return this.translate(a-(b?0:this.pos),!0,!this.horiz,null,!0)},getPlotLinePath:function(a,b,c,d,e){var f=this.chart,g=this.left,h=this.top,i,j,k=c&&f.oldChartHeight||f.chartHeight,
l=c&&f.oldChartWidth||f.chartWidth,m;i=this.transB;var n=function(a,b,c){if(a<b||a>c)d?a=G(w(b,a),c):m=!0;return a},e=q(e,this.translate(a,null,null,c)),a=c=y(e+i);i=j=y(k-e-i);C(e)?this.horiz?(i=h,j=k-this.bottom,a=c=n(a,g,g+this.width)):(a=g,c=l-this.right,i=j=n(i,h,h+this.height)):m=!0;return m&&!d?null:f.renderer.crispLine(["M",a,i,"L",c,j],b||1)},getLinearTickPositions:function(a,b,c){var d,e=ka(V(b/a)*a),f=ka(Ea(c/a)*a),g=[];if(b===c&&C(b))return[b];for(b=e;b<=f;){g.push(b);b=ka(b+a);if(b===
d)break;d=b}return g},getMinorTickPositions:function(){var a=this.options,b=this.tickPositions,c=this.minorTickInterval,d=[],e,f=this.pointRangePadding||0;e=this.min-f;var f=this.max+f,g=f-e;if(g&&g/c<this.len/3)if(this.isLog){f=b.length;for(e=1;e<f;e++)d=d.concat(this.getLogTickPositions(c,b[e-1],b[e],!0))}else if(this.isDatetimeAxis&&a.minorTickInterval==="auto")d=d.concat(this.getTimeTicks(this.normalizeTimeTickInterval(c),e,f,a.startOfWeek));else for(b=e+(b[0]-e)%c;b<=f;b+=c)d.push(b);d.length!==
0&&this.trimTicks(d,a.startOnTick,a.endOnTick);return d},adjustForMinRange:function(){var a=this.options,b=this.min,c=this.max,d,e=this.dataMax-this.dataMin>=this.minRange,f,g,h,i,j,k;if(this.isXAxis&&this.minRange===t&&!this.isLog)v(a.min)||v(a.max)?this.minRange=null:(o(this.series,function(a){i=a.xData;for(g=j=a.xIncrement?1:i.length-1;g>0;g--)if(h=i[g]-i[g-1],f===t||h<f)f=h}),this.minRange=G(f*5,this.dataMax-this.dataMin));if(c-b<this.minRange){k=this.minRange;d=(k-c+b)/2;d=[b-d,q(a.min,b-d)];
if(e)d[2]=this.dataMin;b=Da(d);c=[b+k,q(a.max,b+k)];if(e)c[2]=this.dataMax;c=Ma(c);c-b<k&&(d[0]=c-k,d[1]=q(a.min,c-k),b=Da(d))}this.min=b;this.max=c},getClosest:function(){var a;o(this.series,function(b){var c=b.closestPointRange;!b.noSharedTooltip&&v(c)&&(a=v(a)?G(a,c):c)});return a},setAxisTranslation:function(a){var b=this,c=b.max-b.min,d=b.axisPointRange||0,e,f=0,g=0,h=b.linkedParent,i=!!b.categories,j=b.transA,k=b.isXAxis;if(k||i||d)if(h?(f=h.minPointOffset,g=h.pointRangePadding):(e=b.getClosest(),
o(b.series,function(a){var c=i?1:k?q(a.options.pointRange,e,0):b.axisPointRange||0,a=a.options.pointPlacement;d=w(d,c);b.single||(f=w(f,Ca(a)?0:c/2),g=w(g,a==="on"?0:c))})),h=b.ordinalSlope&&e?b.ordinalSlope/e:1,b.minPointOffset=f*=h,b.pointRangePadding=g*=h,b.pointRange=G(d,c),k)b.closestPointRange=e;if(a)b.oldTransA=j;b.translationSlope=b.transA=j=b.len/(c+g||1);b.transB=b.horiz?b.left:b.bottom;b.minPixelPadding=j*f},minFromRange:function(){return this.max-this.range},setTickInterval:function(a){var b=
this,c=b.chart,d=b.options,e=b.isLog,f=b.log2lin,g=b.isDatetimeAxis,h=b.isXAxis,i=b.isLinked,j=d.maxPadding,k=d.minPadding,l=d.tickInterval,m=d.tickPixelInterval,n=b.categories,p=b.threshold,r=b.softThreshold,s,F,u,x;!g&&!n&&!i&&this.getTickAmount();u=q(b.userMin,d.min);x=q(b.userMax,d.max);i?(b.linkedParent=c[b.coll][d.linkedTo],c=b.linkedParent.getExtremes(),b.min=q(c.min,c.dataMin),b.max=q(c.max,c.dataMax),d.type!==b.linkedParent.options.type&&ga(11,1)):(!r&&v(p)&&(b.dataMin>=p?(s=p,k=0):b.dataMax<=
p&&(F=p,j=0)),b.min=q(u,s,b.dataMin),b.max=q(x,F,b.dataMax));if(e)!a&&G(b.min,q(b.dataMin,b.min))<=0&&ga(10,1),b.min=ka(f(b.min),15),b.max=ka(f(b.max),15);if(b.range&&v(b.max))b.userMin=b.min=u=w(b.min,b.minFromRange()),b.userMax=x=b.max,b.range=null;O(b,"foundExtremes");b.beforePadding&&b.beforePadding();b.adjustForMinRange();if(!n&&!b.axisPointRange&&!b.usePercentage&&!i&&v(b.min)&&v(b.max)&&(f=b.max-b.min))!v(u)&&k&&(b.min-=f*k),!v(x)&&j&&(b.max+=f*j);if(C(d.floor))b.min=w(b.min,d.floor);if(C(d.ceiling))b.max=
G(b.max,d.ceiling);if(r&&v(b.dataMin))if(p=p||0,!v(u)&&b.min<p&&b.dataMin>=p)b.min=p;else if(!v(x)&&b.max>p&&b.dataMax<=p)b.max=p;b.tickInterval=b.min===b.max||b.min===void 0||b.max===void 0?1:i&&!l&&m===b.linkedParent.options.tickPixelInterval?l=b.linkedParent.tickInterval:q(l,this.tickAmount?(b.max-b.min)/w(this.tickAmount-1,1):void 0,n?1:(b.max-b.min)*m/w(b.len,m));h&&!a&&o(b.series,function(a){a.processData(b.min!==b.oldMin||b.max!==b.oldMax)});b.setAxisTranslation(!0);b.beforeSetTickPositions&&
b.beforeSetTickPositions();if(b.postProcessTickInterval)b.tickInterval=b.postProcessTickInterval(b.tickInterval);if(b.pointRange&&!l)b.tickInterval=w(b.pointRange,b.tickInterval);a=q(d.minTickInterval,b.isDatetimeAxis&&b.closestPointRange);if(!l&&b.tickInterval<a)b.tickInterval=a;if(!g&&!e&&!l)b.tickInterval=Ab(b.tickInterval,null,zb(b.tickInterval),q(d.allowDecimals,!(b.tickInterval>0.5&&b.tickInterval<5&&b.max>1E3&&b.max<9999)),!!this.tickAmount);if(!this.tickAmount&&this.len)b.tickInterval=b.unsquish();
this.setTickPositions()},setTickPositions:function(){var a=this.options,b,c=a.tickPositions,d=a.tickPositioner,e=a.startOnTick,f=a.endOnTick,g;this.tickmarkOffset=this.categories&&a.tickmarkPlacement==="between"&&this.tickInterval===1?0.5:0;this.minorTickInterval=a.minorTickInterval==="auto"&&this.tickInterval?this.tickInterval/5:a.minorTickInterval;this.tickPositions=b=c&&c.slice();if(!b&&(b=this.isDatetimeAxis?this.getTimeTicks(this.normalizeTimeTickInterval(this.tickInterval,a.units),this.min,
this.max,a.startOfWeek,this.ordinalPositions,this.closestPointRange,!0):this.isLog?this.getLogTickPositions(this.tickInterval,this.min,this.max):this.getLinearTickPositions(this.tickInterval,this.min,this.max),b.length>this.len&&(b=[b[0],b.pop()]),this.tickPositions=b,d&&(d=d.apply(this,[this.min,this.max]))))this.tickPositions=b=d;if(!this.isLinked)this.trimTicks(b,e,f),this.min===this.max&&v(this.min)&&!this.tickAmount&&(g=!0,this.min-=0.5,this.max+=0.5),this.single=g,!c&&!d&&this.adjustTickAmount()},
trimTicks:function(a,b,c){var d=a[0],e=a[a.length-1],f=this.minPointOffset||0;if(b)this.min=d;else for(;this.min-f>a[0];)a.shift();if(c)this.max=e;else for(;this.max+f<a[a.length-1];)a.pop();a.length===0&&v(d)&&a.push((e+d)/2)},alignToOthers:function(){var a={},b,c=this.options;this.chart.options.chart.alignTicks!==!1&&c.alignTicks!==!1&&o(this.chart[this.coll],function(c){var e=c.options,e=[c.horiz?e.left:e.top,e.width,e.height,e.pane].join(",");c.series.length&&(a[e]?b=!0:a[e]=1)});return b},getTickAmount:function(){var a=
this.options,b=a.tickAmount,c=a.tickPixelInterval;!v(a.tickInterval)&&this.len<c&&!this.isRadial&&!this.isLog&&a.startOnTick&&a.endOnTick&&(b=2);!b&&this.alignToOthers()&&(b=Ea(this.len/c)+1);if(b<4)this.finalTickAmt=b,b=5;this.tickAmount=b},adjustTickAmount:function(){var a=this.tickInterval,b=this.tickPositions,c=this.tickAmount,d=this.finalTickAmt,e=b&&b.length;if(e<c){for(;b.length<c;)b.push(ka(b[b.length-1]+a));this.transA*=(e-1)/(c-1);this.max=b[b.length-1]}else e>c&&(this.tickInterval*=2,this.setTickPositions());
if(v(d)){for(a=c=b.length;a--;)(d===3&&a%2===1||d<=2&&a>0&&a<c-1)&&b.splice(a,1);this.finalTickAmt=t}},setScale:function(){var a,b;this.oldMin=this.min;this.oldMax=this.max;this.oldAxisLength=this.len;this.setAxisSize();b=this.len!==this.oldAxisLength;o(this.series,function(b){if(b.isDirtyData||b.isDirty||b.xAxis.isDirty)a=!0});if(b||a||this.isLinked||this.forceRedraw||this.userMin!==this.oldUserMin||this.userMax!==this.oldUserMax||this.alignToOthers()){if(this.resetStacks&&this.resetStacks(),this.forceRedraw=
!1,this.getSeriesExtremes(),this.setTickInterval(),this.oldUserMin=this.userMin,this.oldUserMax=this.userMax,!this.isDirty)this.isDirty=b||this.min!==this.oldMin||this.max!==this.oldMax}else this.cleanStacks&&this.cleanStacks()},setExtremes:function(a,b,c,d,e){var f=this,g=f.chart,c=q(c,!0);o(f.series,function(a){delete a.kdTree});e=A(e,{min:a,max:b});O(f,"setExtremes",e,function(){f.userMin=a;f.userMax=b;f.eventArgs=e;c&&g.redraw(d)})},zoom:function(a,b){var c=this.dataMin,d=this.dataMax,e=this.options,
f=G(c,q(e.min,c)),e=w(d,q(e.max,d));this.allowZoomOutside||(v(c)&&a<=f&&(a=f),v(d)&&b>=e&&(b=e));this.displayBtn=a!==t||b!==t;this.setExtremes(a,b,!1,t,{trigger:"zoom"});return!0},setAxisSize:function(){var a=this.chart,b=this.options,c=b.offsetLeft||0,d=this.horiz,e=q(b.width,a.plotWidth-c+(b.offsetRight||0)),f=q(b.height,a.plotHeight),g=q(b.top,a.plotTop),b=q(b.left,a.plotLeft+c),c=/%$/;c.test(f)&&(f=Math.round(parseFloat(f)/100*a.plotHeight));c.test(g)&&(g=Math.round(parseFloat(g)/100*a.plotHeight+
a.plotTop));this.left=b;this.top=g;this.width=e;this.height=f;this.bottom=a.chartHeight-f-g;this.right=a.chartWidth-e-b;this.len=w(d?e:f,0);this.pos=d?b:g},getExtremes:function(){var a=this.isLog,b=this.lin2log;return{min:a?ka(b(this.min)):this.min,max:a?ka(b(this.max)):this.max,dataMin:this.dataMin,dataMax:this.dataMax,userMin:this.userMin,userMax:this.userMax}},getThreshold:function(a){var b=this.isLog,c=this.lin2log,d=b?c(this.min):this.min,b=b?c(this.max):this.max;a===null?a=b<0?b:d:d>a?a=d:b<
a&&(a=b);return this.translate(a,0,1,0,1)},autoLabelAlign:function(a){a=(q(a,0)-this.side*90+720)%360;return a>15&&a<165?"right":a>195&&a<345?"left":"center"},tickSize:function(a){var b=this.options,c=b[a+"Length"],d=q(b[a+"Width"],a==="tick"&&this.isXAxis?1:0);if(d&&c)return b[a+"Position"]==="inside"&&(c=-c),[c,d]},labelMetrics:function(){return this.chart.renderer.fontMetrics(this.options.labels.style.fontSize,this.ticks[0]&&this.ticks[0].label)},unsquish:function(){var a=this.options.labels,b=
this.horiz,c=this.tickInterval,d=c,e=this.len/(((this.categories?1:0)+this.max-this.min)/c),f,g=a.rotation,h=this.labelMetrics(),i,j=Number.MAX_VALUE,k,l=function(a){a/=e||1;a=a>1?Ea(a):1;return a*c};b?(k=!a.staggerLines&&!a.step&&(v(g)?[g]:e<q(a.autoRotationLimit,80)&&a.autoRotation))&&o(k,function(a){var b;if(a===g||a&&a>=-90&&a<=90)i=l(S(h.h/la(pa*a))),b=i+S(a/360),b<j&&(j=b,f=a,d=i)}):a.step||(d=l(h.h));this.autoRotation=k;this.labelRotation=q(f,g);return d},getSlotWidth:function(){var a=this.chart,
b=this.horiz,c=this.options.labels,d=Math.max(this.tickPositions.length-(this.categories?0:1),1),e=a.margin[3];return b&&(c.step||0)<2&&!c.rotation&&(this.staggerLines||1)*a.plotWidth/d||!b&&(e&&e-a.spacing[3]||a.chartWidth*0.33)},renderUnsquish:function(){var a=this.chart,b=a.renderer,c=this.tickPositions,d=this.ticks,e=this.options.labels,f=this.horiz,g=this.getSlotWidth(),h=w(1,y(g-2*(e.padding||5))),i={},j=this.labelMetrics(),k=e.style.textOverflow,l,m=0,n,p;if(!Ca(e.rotation))i.rotation=e.rotation||
0;if(this.autoRotation)o(c,function(a){if((a=d[a])&&a.labelLength>m)m=a.labelLength}),m>h&&m>j.h?i.rotation=this.labelRotation:this.labelRotation=0;else if(g&&(l={width:h+"px"},!k)){l.textOverflow="clip";for(n=c.length;!f&&n--;)if(p=c[n],h=d[p].label)if(h.styles.textOverflow==="ellipsis"?h.css({textOverflow:"clip"}):d[p].labelLength>g&&h.css({width:g+"px"}),h.getBBox().height>this.len/c.length-(j.h-j.f))h.specCss={textOverflow:"ellipsis"}}if(i.rotation&&(l={width:(m>a.chartHeight*0.5?a.chartHeight*
0.33:a.chartHeight)+"px"},!k))l.textOverflow="ellipsis";if(this.labelAlign=e.align||this.autoLabelAlign(this.labelRotation))i.align=this.labelAlign;o(c,function(a){var b=(a=d[a])&&a.label;if(b)b.attr(i),l&&b.css(z(l,b.specCss)),delete b.specCss,a.rotation=i.rotation});this.tickRotCorr=b.rotCorr(j.b,this.labelRotation||0,this.side!==0)},hasData:function(){return this.hasVisibleSeries||v(this.min)&&v(this.max)&&!!this.tickPositions},getOffset:function(){var a=this,b=a.chart,c=b.renderer,d=a.options,
e=a.tickPositions,f=a.ticks,g=a.horiz,h=a.side,i=b.inverted?[1,0,3,2][h]:h,j,k,l=0,m,n=0,p=d.title,r=d.labels,s=0,F=a.opposite,u=b.axisOffset,b=b.clipOffset,x=[-1,1,1,-1][h],D,Q=a.axisParent,ha=this.tickSize("tick");j=a.hasData();a.showAxis=k=j||q(d.showEmpty,!0);a.staggerLines=a.horiz&&r.staggerLines;if(!a.axisGroup)a.gridGroup=c.g("grid").attr({zIndex:d.gridZIndex||1}).add(Q),a.axisGroup=c.g("axis").attr({zIndex:d.zIndex||2}).add(Q),a.labelGroup=c.g("axis-labels").attr({zIndex:r.zIndex||7}).addClass("highcharts-"+
a.coll.toLowerCase()+"-labels").add(Q);if(j||a.isLinked){if(o(e,function(b){f[b]?f[b].addLabel():f[b]=new bb(a,b)}),a.renderUnsquish(),r.reserveSpace!==!1&&(h===0||h===2||{1:"left",3:"right"}[h]===a.labelAlign||a.labelAlign==="center")&&o(e,function(a){s=w(f[a].getLabelSize(),s)}),a.staggerLines)s*=a.staggerLines,a.labelOffset=s*(a.opposite?-1:1)}else for(D in f)f[D].destroy(),delete f[D];if(p&&p.text&&p.enabled!==!1){if(!a.axisTitle)(D=p.textAlign)||(D=(g?{low:"left",middle:"center",high:"right"}:
{low:F?"right":"left",middle:"center",high:F?"left":"right"})[p.align]),a.axisTitle=c.text(p.text,0,0,p.useHTML).attr({zIndex:7,rotation:p.rotation||0,align:D}).addClass("highcharts-"+this.coll.toLowerCase()+"-title").css(p.style).add(a.axisGroup),a.axisTitle.isNew=!0;if(k)l=a.axisTitle.getBBox()[g?"height":"width"],m=p.offset,n=v(m)?0:q(p.margin,g?5:10);a.axisTitle[k?"show":"hide"](!0)}a.offset=x*q(d.offset,u[h]);a.tickRotCorr=a.tickRotCorr||{x:0,y:0};c=h===0?-a.labelMetrics().h:h===2?a.tickRotCorr.y:
0;n=Math.abs(s)+n;s&&(n-=c,n+=x*(g?q(r.y,a.tickRotCorr.y+x*8):r.x));a.axisTitleMargin=q(m,n);u[h]=w(u[h],a.axisTitleMargin+l+x*a.offset,n,j&&e.length&&ha?ha[0]:0);d=d.offset?0:V(d.lineWidth/2)*2;b[i]=w(b[i],d)},getLinePath:function(a){var b=this.chart,c=this.opposite,d=this.offset,e=this.horiz,f=this.left+(c?this.width:0)+d,d=b.chartHeight-this.bottom-(c?this.height:0)+d;c&&(a*=-1);return b.renderer.crispLine(["M",e?this.left:f,e?d:this.top,"L",e?b.chartWidth-this.right:f,e?d:b.chartHeight-this.bottom],
a)},getTitlePosition:function(){var a=this.horiz,b=this.left,c=this.top,d=this.len,e=this.options.title,f=a?b:c,g=this.opposite,h=this.offset,i=e.x||0,j=e.y||0,k=K(e.style.fontSize||12),d={low:f+(a?0:d),middle:f+d/2,high:f+(a?d:0)}[e.align],b=(a?c+this.height:b)+(a?1:-1)*(g?-1:1)*this.axisTitleMargin+(this.side===2?k:0);return{x:a?d+i:b+(g?this.width:0)+h+i,y:a?b+j-(g?this.height:0)+h:d+j}},render:function(){var a=this,b=a.chart,c=b.renderer,d=a.options,e=a.isLog,f=a.lin2log,g=a.isLinked,h=a.tickPositions,
i=a.axisTitle,j=a.ticks,k=a.minorTicks,l=a.alternateBands,m=d.stackLabels,n=d.alternateGridColor,p=a.tickmarkOffset,r=d.lineWidth,s,q=b.hasRendered&&C(a.oldMin),u=a.showAxis,x=gb(c.globalAnimation),D,Q;a.labelEdge.length=0;a.overlap=!1;o([j,k,l],function(a){for(var b in a)a[b].isActive=!1});if(a.hasData()||g){a.minorTickInterval&&!a.categories&&o(a.getMinorTickPositions(),function(b){k[b]||(k[b]=new bb(a,b,"minor"));q&&k[b].isNew&&k[b].render(null,!0);k[b].render(null,!1,1)});if(h.length&&(o(h,function(b,
c){if(!g||b>=a.min&&b<=a.max)j[b]||(j[b]=new bb(a,b)),q&&j[b].isNew&&j[b].render(c,!0,0.1),j[b].render(c)}),p&&(a.min===0||a.single)))j[-1]||(j[-1]=new bb(a,-1,null,!0)),j[-1].render(-1);n&&o(h,function(c,d){Q=h[d+1]!==t?h[d+1]+p:a.max-p;if(d%2===0&&c<a.max&&Q<=a.max+(b.polar?-p:p))l[c]||(l[c]=new B.PlotLineOrBand(a)),D=c+p,l[c].options={from:e?f(D):D,to:e?f(Q):Q,color:n},l[c].render(),l[c].isActive=!0});if(!a._addedPlotLB)o((d.plotLines||[]).concat(d.plotBands||[]),function(b){a.addPlotBandOrLine(b)}),
a._addedPlotLB=!0}o([j,k,l],function(a){var c,d,e=[],f=x.duration;for(c in a)if(!a[c].isActive)a[c].render(c,!1,0),a[c].isActive=!1,e.push(c);Za(function(){for(d=e.length;d--;)a[e[d]]&&!a[e[d]].isActive&&(a[e[d]].destroy(),delete a[e[d]])},a===l||!b.hasRendered||!f?0:f)});if(r)s=a.getLinePath(r),a.axisLine?a.axisLine.animate({d:s}):a.axisLine=c.path(s).attr({stroke:d.lineColor,"stroke-width":r,zIndex:7}).add(a.axisGroup),a.axisLine[u?"show":"hide"](!0);if(i&&u)i[i.isNew?"attr":"animate"](a.getTitlePosition()),
i.isNew=!1;m&&m.enabled&&a.renderStackTotals();a.isDirty=!1},redraw:function(){this.visible&&(this.render(),o(this.plotLinesAndBands,function(a){a.render()}));o(this.series,function(a){a.isDirty=!0})},destroy:function(a){var b=this,c=b.stacks,d,e=b.plotLinesAndBands;a||T(b);for(d in c)Pa(c[d]),c[d]=null;o([b.ticks,b.minorTicks,b.alternateBands],function(a){Pa(a)});for(a=e.length;a--;)e[a].destroy();o("stackTotalGroup,axisLine,axisTitle,axisGroup,cross,gridGroup,labelGroup".split(","),function(a){b[a]&&
(b[a]=b[a].destroy())});this.cross&&this.cross.destroy()},drawCrosshair:function(a,b){var c,d=this.crosshair,e,f;if(!this.crosshair||(v(b)||!q(d.snap,!0))===!1)this.hideCrosshair();else if(q(d.snap,!0)?v(b)&&(c=this.isXAxis?b.plotX:this.len-b.plotY):c=this.horiz?a.chartX-this.pos:this.len-a.chartY+this.pos,c=this.isRadial?this.getPlotLinePath(this.isXAxis?b.x:q(b.stackY,b.y))||null:this.getPlotLinePath(null,null,null,null,c)||null,c===null)this.hideCrosshair();else if(e=this.categories&&!this.isRadial,
f=q(d.width,e?this.transA:1),this.cross)this.cross.attr({d:c,visibility:"visible","stroke-width":f});else{e={"pointer-events":"none","stroke-width":f,stroke:d.color||(e?"rgba(155,200,255,0.2)":"#C0C0C0"),zIndex:q(d.zIndex,2)};if(d.dashStyle)e.dashstyle=d.dashStyle;this.cross=this.chart.renderer.path(c).attr(e).add()}},hideCrosshair:function(){this.cross&&this.cross.hide()}};A(J.prototype,{getPlotBandPath:function(a,b){var c=this.getPlotLinePath(b,null,null,!0),d=this.getPlotLinePath(a,null,null,!0);
d&&c?(d.flat=d.toString()===c.toString(),d.push(c[4],c[5],c[1],c[2])):d=null;return d},addPlotBand:function(a){return this.addPlotBandOrLine(a,"plotBands")},addPlotLine:function(a){return this.addPlotBandOrLine(a,"plotLines")},addPlotBandOrLine:function(a,b){var c=(new B.PlotLineOrBand(this,a)).render(),d=this.userOptions;c&&(b&&(d[b]=d[b]||[],d[b].push(a)),this.plotLinesAndBands.push(c));return c},removePlotBandOrLine:function(a){for(var b=this.plotLinesAndBands,c=this.options,d=this.userOptions,
e=b.length;e--;)b[e].id===a&&b[e].destroy();o([c.plotLines||[],d.plotLines||[],c.plotBands||[],d.plotBands||[]],function(b){for(e=b.length;e--;)b[e].id===a&&za(b,b[e])})}});J.prototype.getTimeTicks=function(a,b,c,d){var e=[],f={},g=R.global.useUTC,h,i=new ba(b-eb(b)),j=a.unitRange,k=a.count;if(v(b)){i[Pb](j>=M.second?0:k*V(i.getMilliseconds()/k));if(j>=M.second)i[Qb](j>=M.minute?0:k*V(i.getSeconds()/k));if(j>=M.minute)i[Rb](j>=M.hour?0:k*V(i[Bb]()/k));if(j>=M.hour)i[Sb](j>=M.day?0:k*V(i[Cb]()/k));
if(j>=M.day)i[qb](j>=M.month?1:k*V(i[ab]()/k));j>=M.month&&(i[Eb](j>=M.year?0:k*V(i[hb]()/k)),h=i[ib]());j>=M.year&&(h-=h%k,i[Fb](h));if(j===M.week)i[qb](i[ab]()-i[Db]()+q(d,1));b=1;if(yb||fb)i=i.getTime(),i=new ba(i+eb(i));h=i[ib]();for(var d=i.getTime(),l=i[hb](),m=i[ab](),n=!g||!!fb,p=(M.day+(g?eb(i):i.getTimezoneOffset()*6E4))%M.day;d<c;)e.push(d),j===M.year?d=pb(h+b*k,0):j===M.month?d=pb(h,l+b*k):n&&(j===M.day||j===M.week)?d=pb(h,l,m+b*k*(j===M.day?1:7)):d+=j*k,b++;e.push(d);o(Fa(e,function(a){return j<=
M.hour&&a%M.day===p}),function(a){f[a]="day"})}e.info=A(a,{higherRanks:f,totalRange:j*k});return e};J.prototype.normalizeTimeTickInterval=function(a,b){var c=b||[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],["hour",[1,2,3,4,6,8,12]],["day",[1,2]],["week",[1,2]],["month",[1,2,3,4,6]],["year",null]],d=c[c.length-1],e=M[d[0]],f=d[1],g;for(g=0;g<c.length;g++)if(d=c[g],e=M[d[0]],f=d[1],c[g+1]&&a<=(e*f[f.length-1]+M[c[g+1][0]])/2)break;e===M.year&&
a<5*e&&(f=[1,2,5]);c=Ab(a/e,f,d[0]==="year"?w(zb(a/e),1):1);return{unitRange:e,count:c,unitName:d[0]}};J.prototype.getLogTickPositions=function(a,b,c,d){var e=this.options,f=this.len,g=this.lin2log,h=this.log2lin,i=[];if(!d)this._minorAutoInterval=null;if(a>=0.5)a=y(a),i=this.getLinearTickPositions(a,b,c);else if(a>=0.08)for(var f=V(b),j,k,l,m,n,e=a>0.3?[1,2,4]:a>0.15?[1,2,4,6,8]:[1,2,3,4,5,6,7,8,9];f<c+1&&!n;f++){k=e.length;for(j=0;j<k&&!n;j++)l=h(g(f)*e[j]),l>b&&(!d||m<=c)&&m!==t&&i.push(m),m>c&&
(n=!0),m=l}else if(b=g(b),c=g(c),a=e[d?"minorTickInterval":"tickInterval"],a=q(a==="auto"?null:a,this._minorAutoInterval,(c-b)*(e.tickPixelInterval/(d?5:1))/((d?f/this.tickPositions.length:f)||1)),a=Ab(a,null,zb(a)),i=ta(this.getLinearTickPositions(a,b,c),h),!d)this._minorAutoInterval=a/5;if(!d)this.tickInterval=a;return i};J.prototype.log2lin=function(a){return Y.log(a)/Y.LN10};J.prototype.lin2log=function(a){return Y.pow(10,a)};var Lb=B.Tooltip=function(){this.init.apply(this,arguments)};Lb.prototype=
{init:function(a,b){var c=b.borderWidth,d=b.style,e=K(d.padding);this.chart=a;this.options=b;this.crosshairs=[];this.now={x:0,y:0};this.isHidden=!0;this.label=a.renderer.label("",0,0,b.shape||"callout",null,null,b.useHTML,null,"tooltip").attr({padding:e,fill:b.backgroundColor,"stroke-width":c,r:b.borderRadius,zIndex:8}).css(d).css({padding:0}).add().attr({y:-9999});qa||this.label.shadow(b.shadow);this.shared=b.shared},destroy:function(){if(this.label)this.label=this.label.destroy();clearTimeout(this.hideTimer);
clearTimeout(this.tooltipTimeout)},move:function(a,b,c,d){var e=this,f=e.now,g=e.options.animation!==!1&&!e.isHidden&&(S(a-f.x)>1||S(b-f.y)>1),h=e.followPointer||e.len>1;A(f,{x:g?(2*f.x+a)/3:a,y:g?(f.y+b)/2:b,anchorX:h?t:g?(2*f.anchorX+c)/3:c,anchorY:h?t:g?(f.anchorY+d)/2:d});e.label.attr(f);if(g)clearTimeout(this.tooltipTimeout),this.tooltipTimeout=setTimeout(function(){e&&e.move(a,b,c,d)},32)},hide:function(a){var b=this;clearTimeout(this.hideTimer);a=q(a,this.options.hideDelay,500);if(!this.isHidden)this.hideTimer=
Za(function(){b.label[a?"fadeOut":"hide"]();b.isHidden=!0},a)},getAnchor:function(a,b){var c,d=this.chart,e=d.inverted,f=d.plotTop,g=d.plotLeft,h=0,i=0,j,k,a=ua(a);c=a[0].tooltipPos;this.followPointer&&b&&(b.chartX===t&&(b=d.pointer.normalize(b)),c=[b.chartX-d.plotLeft,b.chartY-f]);c||(o(a,function(a){j=a.series.yAxis;k=a.series.xAxis;h+=a.plotX+(!e&&k?k.left-g:0);i+=(a.plotLow?(a.plotLow+a.plotHigh)/2:a.plotY)+(!e&&j?j.top-f:0)}),h/=a.length,i/=a.length,c=[e?d.plotWidth-i:h,this.shared&&!e&&a.length>
1&&b?b.chartY-f:e?d.plotHeight-h:i]);return ta(c,y)},getPosition:function(a,b,c){var d=this.chart,e=this.distance,f={},g=c.h||0,h,i=["y",d.chartHeight,b,c.plotY+d.plotTop,d.plotTop,d.plotTop+d.plotHeight],j=["x",d.chartWidth,a,c.plotX+d.plotLeft,d.plotLeft,d.plotLeft+d.plotWidth],k=!this.followPointer&&q(c.ttBelow,!d.inverted===!!c.negative),l=function(a,b,c,d,h,i){var j=c<d-e,m=d+e+c<b,l=d-e-c;d+=e;if(k&&m)f[a]=d;else if(!k&&j)f[a]=l;else if(j)f[a]=G(i-c,l-g<0?l:l-g);else if(m)f[a]=w(h,d+g+c>b?d:
d+g);else return!1},m=function(a,b,c,d){var g;d<e||d>b-e?g=!1:f[a]=d<c/2?1:d>b-c/2?b-c-2:d-c/2;return g},n=function(a){var b=i;i=j;j=b;h=a},p=function(){l.apply(0,i)!==!1?m.apply(0,j)===!1&&!h&&(n(!0),p()):h?f.x=f.y=0:(n(!0),p())};(d.inverted||this.len>1)&&n();p();return f},defaultFormatter:function(a){var b=this.points||ua(this),c;c=[a.tooltipFooterHeaderFormatter(b[0])];c=c.concat(a.bodyFormatter(b));c.push(a.tooltipFooterHeaderFormatter(b[0],!0));return c.join("")},refresh:function(a,b){var c=
this.chart,d=this.label,e=this.options,f,g,h,i={},j,k=[];j=e.formatter||this.defaultFormatter;var i=c.hoverPoints,l,m=this.shared;clearTimeout(this.hideTimer);this.followPointer=ua(a)[0].series.tooltipOptions.followPointer;h=this.getAnchor(a,b);f=h[0];g=h[1];m&&(!a.series||!a.series.noSharedTooltip)?(c.hoverPoints=a,i&&o(i,function(a){a.setState()}),o(a,function(a){a.setState("hover");k.push(a.getLabelConfig())}),i={x:a[0].category,y:a[0].y},i.points=k,this.len=k.length,a=a[0]):i=a.getLabelConfig();
j=j.call(i,this);i=a.series;this.distance=q(i.tooltipOptions.distance,16);j===!1?this.hide():(this.isHidden&&(Sa(d),d.attr("opacity",1).show()),d.attr({text:j}),l=e.borderColor||a.color||i.color||"#606060",d.attr({stroke:l}),this.updatePosition({plotX:f,plotY:g,negative:a.negative,ttBelow:a.ttBelow,h:h[2]||0}),this.isHidden=!1);O(c,"tooltipRefresh",{text:j,x:f+c.plotLeft,y:g+c.plotTop,borderColor:l})},updatePosition:function(a){var b=this.chart,c=this.label,c=(this.options.positioner||this.getPosition).call(this,
c.width,c.height,a);this.move(y(c.x),y(c.y||0),a.plotX+b.plotLeft,a.plotY+b.plotTop)},getXDateFormat:function(a,b,c){var d,b=b.dateTimeLabelFormats,e=c&&c.closestPointRange,f,g={millisecond:15,second:12,minute:9,hour:6,day:3},h,i="millisecond";if(e){h=na("%m-%d %H:%M:%S.%L",a.x);for(f in M){if(e===M.week&&+na("%w",a.x)===c.options.startOfWeek&&h.substr(6)==="00:00:00.000"){f="week";break}if(M[f]>e){f=i;break}if(g[f]&&h.substr(g[f])!=="01-01 00:00:00.000".substr(g[f]))break;f!=="week"&&(i=f)}f&&(d=
b[f])}else d=b.day;return d||b.year},tooltipFooterHeaderFormatter:function(a,b){var c=b?"footer":"header",d=a.series,e=d.tooltipOptions,f=e.xDateFormat,g=d.xAxis,h=g&&g.options.type==="datetime"&&C(a.key),c=e[c+"Format"];h&&!f&&(f=this.getXDateFormat(a,e,g));h&&f&&(c=c.replace("{point.key}","{point.key:"+f+"}"));return La(c,{point:a,series:d})},bodyFormatter:function(a){return ta(a,function(a){var c=a.series.tooltipOptions;return(c.pointFormatter||a.point.tooltipFormatter).call(a.point,c.pointFormat)})}};
var oa;cb=H&&H.documentElement.ontouchstart!==t;var Ya=B.Pointer=function(a,b){this.init(a,b)};Ya.prototype={init:function(a,b){var c=b.chart,d=c.events,e=qa?"":c.zoomType,c=a.inverted,f;this.options=b;this.chart=a;this.zoomX=f=/x/.test(e);this.zoomY=e=/y/.test(e);this.zoomHor=f&&!c||e&&c;this.zoomVert=e&&!c||f&&c;this.hasZoom=f||e;this.runChartClick=d&&!!d.click;this.pinchDown=[];this.lastValidTouch={};if(B.Tooltip&&b.tooltip.enabled)a.tooltip=new Lb(a,b.tooltip),this.followTouchMove=q(b.tooltip.followTouchMove,
!0);this.setDOMEvents()},normalize:function(a,b){var c,d,a=a||L.event;if(!a.target)a.target=a.srcElement;d=a.touches?a.touches.length?a.touches.item(0):a.changedTouches[0]:a;if(!b)this.chartPosition=b=Jb(this.chart.container);d.pageX===t?(c=w(a.x,a.clientX-b.left),d=a.y):(c=d.pageX-b.left,d=d.pageY-b.top);return A(a,{chartX:y(c),chartY:y(d)})},getCoordinates:function(a){var b={xAxis:[],yAxis:[]};o(this.chart.axes,function(c){b[c.isXAxis?"xAxis":"yAxis"].push({axis:c,value:c.toValue(a[c.horiz?"chartX":
"chartY"])})});return b},runPointActions:function(a){var b=this.chart,c=b.series,d=b.tooltip,e=d?d.shared:!1,f=b.hoverPoint,g=b.hoverSeries,h,i=[Number.MAX_VALUE,Number.MAX_VALUE],j,k,l=[],m=[],n;if(!e&&!g)for(h=0;h<c.length;h++)if(c[h].directTouch||!c[h].options.stickyTracking)c=[];g&&(e?g.noSharedTooltip:g.directTouch)&&f?m=[f]:(o(c,function(b){j=b.noSharedTooltip&&e;k=!e&&b.directTouch;b.visible&&!j&&!k&&q(b.options.enableMouseTracking,!0)&&(n=b.searchPoint(a,!j&&b.kdDimensions===1))&&l.push(n)}),
o(l,function(a){a&&o(["dist","distX"],function(b,c){if(C(a[b])){var d=a[b]===i[c]&&a.series.group.zIndex>=m[c].series.group.zIndex;if(a[b]<i[c]||d)i[c]=a[b],m[c]=a}})}));if(e)for(h=l.length;h--;)(l[h].clientX!==m[1].clientX||l[h].series.noSharedTooltip)&&l.splice(h,1);if(m[0]&&(m[0]!==this.prevKDPoint||d&&d.isHidden))if(e&&!m[0].series.noSharedTooltip)l.length&&d&&d.refresh(l,a),o(l,function(b){b.onMouseOver(a,b!==(g&&g.directTouch&&f||m[0]))}),this.prevKDPoint=m[1];else{d&&d.refresh(m[0],a);if(!g||
!g.directTouch)m[0].onMouseOver(a);this.prevKDPoint=m[0]}else c=g&&g.tooltipOptions.followPointer,d&&c&&!d.isHidden&&(c=d.getAnchor([{}],a),d.updatePosition({plotX:c[0],plotY:c[1]}));if(!this._onDocumentMouseMove)this._onDocumentMouseMove=function(a){if($[oa])$[oa].pointer.onDocumentMouseMove(a)},E(H,"mousemove",this._onDocumentMouseMove);o(e?l:[q(f,m[1])],function(c){o(b.axes,function(b){(!c||c.series[b.coll]===b)&&b.drawCrosshair(a,c)})})},reset:function(a,b){var c=this.chart,d=c.hoverSeries,e=
c.hoverPoint,f=c.hoverPoints,g=c.tooltip,h=g&&g.shared?f:e;a&&h&&o(ua(h),function(b){b.series.isCartesian&&b.plotX===void 0&&(a=!1)});if(a)g&&h&&(g.refresh(h),e&&(e.setState(e.state,!0),o(c.axes,function(a){q(a.crosshair&&a.crosshair.snap,!0)?a.drawCrosshair(null,e):a.hideCrosshair()})));else{if(e)e.onMouseOut();f&&o(f,function(a){a.setState()});if(d)d.onMouseOut();g&&g.hide(b);if(this._onDocumentMouseMove)T(H,"mousemove",this._onDocumentMouseMove),this._onDocumentMouseMove=null;o(c.axes,function(a){a.hideCrosshair()});
this.hoverX=c.hoverPoints=c.hoverPoint=null}},scaleGroups:function(a,b){var c=this.chart,d;o(c.series,function(e){d=a||e.getPlotBox();e.xAxis&&e.xAxis.zoomEnabled&&(e.group.attr(d),e.markerGroup&&(e.markerGroup.attr(d),e.markerGroup.clip(b?c.clipRect:null)),e.dataLabelsGroup&&e.dataLabelsGroup.attr(d))});c.clipRect.attr(b||c.clipBox)},dragStart:function(a){var b=this.chart;b.mouseIsDown=a.type;b.cancelClick=!1;b.mouseDownX=this.mouseDownX=a.chartX;b.mouseDownY=this.mouseDownY=a.chartY},drag:function(a){var b=
this.chart,c=b.options.chart,d=a.chartX,e=a.chartY,f=this.zoomHor,g=this.zoomVert,h=b.plotLeft,i=b.plotTop,j=b.plotWidth,k=b.plotHeight,l,m=this.selectionMarker,n=this.mouseDownX,p=this.mouseDownY,r=c.panKey&&a[c.panKey+"Key"];if(!m||!m.touch)if(d<h?d=h:d>h+j&&(d=h+j),e<i?e=i:e>i+k&&(e=i+k),this.hasDragged=Math.sqrt(Math.pow(n-d,2)+Math.pow(p-e,2)),this.hasDragged>10){l=b.isInsidePlot(n-h,p-i);if(b.hasCartesianSeries&&(this.zoomX||this.zoomY)&&l&&!r&&!m)this.selectionMarker=m=b.renderer.rect(h,i,
f?1:j,g?1:k,0).attr({fill:c.selectionMarkerFill||"rgba(69,114,167,0.25)",zIndex:7}).add();m&&f&&(d-=n,m.attr({width:S(d),x:(d>0?0:d)+n}));m&&g&&(d=e-p,m.attr({height:S(d),y:(d>0?0:d)+p}));l&&!m&&c.panning&&b.pan(a,c.panning)}},drop:function(a){var b=this,c=this.chart,d=this.hasPinched;if(this.selectionMarker){var e={originalEvent:a,xAxis:[],yAxis:[]},f=this.selectionMarker,g=f.attr?f.attr("x"):f.x,h=f.attr?f.attr("y"):f.y,i=f.attr?f.attr("width"):f.width,j=f.attr?f.attr("height"):f.height,k;if(this.hasDragged||
d)o(c.axes,function(c){if(c.zoomEnabled&&v(c.min)&&(d||b[{xAxis:"zoomX",yAxis:"zoomY"}[c.coll]])){var f=c.horiz,n=a.type==="touchend"?c.minPixelPadding:0,p=c.toValue((f?g:h)+n),f=c.toValue((f?g+i:h+j)-n);e[c.coll].push({axis:c,min:G(p,f),max:w(p,f)});k=!0}}),k&&O(c,"selection",e,function(a){c.zoom(A(a,d?{animation:!1}:null))});this.selectionMarker=this.selectionMarker.destroy();d&&this.scaleGroups()}if(c)N(c.container,{cursor:c._cursor}),c.cancelClick=this.hasDragged>10,c.mouseIsDown=this.hasDragged=
this.hasPinched=!1,this.pinchDown=[]},onContainerMouseDown:function(a){a=this.normalize(a);a.preventDefault&&a.preventDefault();this.dragStart(a)},onDocumentMouseUp:function(a){$[oa]&&$[oa].pointer.drop(a)},onDocumentMouseMove:function(a){var b=this.chart,c=this.chartPosition,a=this.normalize(a,c);c&&!this.inClass(a.target,"highcharts-tracker")&&!b.isInsidePlot(a.chartX-b.plotLeft,a.chartY-b.plotTop)&&this.reset()},onContainerMouseLeave:function(a){var b=$[oa];if(b&&(a.relatedTarget||a.toElement))b.pointer.reset(),
b.pointer.chartPosition=null},onContainerMouseMove:function(a){var b=this.chart;if(!v(oa)||!$[oa]||!$[oa].mouseIsDown)oa=b.index;a=this.normalize(a);a.returnValue=!1;b.mouseIsDown==="mousedown"&&this.drag(a);(this.inClass(a.target,"highcharts-tracker")||b.isInsidePlot(a.chartX-b.plotLeft,a.chartY-b.plotTop))&&!b.openMenu&&this.runPointActions(a)},inClass:function(a,b){for(var c;a;){if(c=X(a,"class")){if(c.indexOf(b)!==-1)return!0;if(c.indexOf("highcharts-container")!==-1)return!1}a=a.parentNode}},
onTrackerMouseOut:function(a){var b=this.chart.hoverSeries,a=a.relatedTarget||a.toElement;if(b&&a&&!b.options.stickyTracking&&!this.inClass(a,"highcharts-tooltip")&&!this.inClass(a,"highcharts-series-"+b.index))b.onMouseOut()},onContainerClick:function(a){var b=this.chart,c=b.hoverPoint,d=b.plotLeft,e=b.plotTop,a=this.normalize(a);b.cancelClick||(c&&this.inClass(a.target,"highcharts-tracker")?(O(c.series,"click",A(a,{point:c})),b.hoverPoint&&c.firePointEvent("click",a)):(A(a,this.getCoordinates(a)),
b.isInsidePlot(a.chartX-d,a.chartY-e)&&O(b,"click",a)))},setDOMEvents:function(){var a=this,b=a.chart.container;b.onmousedown=function(b){a.onContainerMouseDown(b)};b.onmousemove=function(b){a.onContainerMouseMove(b)};b.onclick=function(b){a.onContainerClick(b)};E(b,"mouseleave",a.onContainerMouseLeave);kb===1&&E(H,"mouseup",a.onDocumentMouseUp);if(cb)b.ontouchstart=function(b){a.onContainerTouchStart(b)},b.ontouchmove=function(b){a.onContainerTouchMove(b)},kb===1&&E(H,"touchend",a.onDocumentTouchEnd)},
destroy:function(){var a;T(this.chart.container,"mouseleave",this.onContainerMouseLeave);kb||(T(H,"mouseup",this.onDocumentMouseUp),T(H,"touchend",this.onDocumentTouchEnd));clearInterval(this.tooltipTimeout);for(a in this)this[a]=null}};A(B.Pointer.prototype,{pinchTranslate:function(a,b,c,d,e,f){(this.zoomHor||this.pinchHor)&&this.pinchTranslateDirection(!0,a,b,c,d,e,f);(this.zoomVert||this.pinchVert)&&this.pinchTranslateDirection(!1,a,b,c,d,e,f)},pinchTranslateDirection:function(a,b,c,d,e,f,g,h){var i=
this.chart,j=a?"x":"y",k=a?"X":"Y",l="chart"+k,m=a?"width":"height",n=i["plot"+(a?"Left":"Top")],p,r,s=h||1,q=i.inverted,o=i.bounds[a?"h":"v"],x=b.length===1,D=b[0][l],v=c[0][l],w=!x&&b[1][l],y=!x&&c[1][l],t,c=function(){!x&&S(D-w)>20&&(s=h||S(v-y)/S(D-w));r=(n-v)/s+D;p=i["plot"+(a?"Width":"Height")]/s};c();b=r;b<o.min?(b=o.min,t=!0):b+p>o.max&&(b=o.max-p,t=!0);t?(v-=0.8*(v-g[j][0]),x||(y-=0.8*(y-g[j][1])),c()):g[j]=[v,y];q||(f[j]=r-n,f[m]=p);f=q?1/s:s;e[m]=p;e[j]=b;d[q?a?"scaleY":"scaleX":"scale"+
k]=s;d["translate"+k]=f*n+(v-f*D)},pinch:function(a){var b=this,c=b.chart,d=b.pinchDown,e=a.touches,f=e.length,g=b.lastValidTouch,h=b.hasZoom,i=b.selectionMarker,j={},k=f===1&&(b.inClass(a.target,"highcharts-tracker")&&c.runTrackerClick||b.runChartClick),l={};if(f>1)b.initiated=!0;h&&b.initiated&&!k&&a.preventDefault();ta(e,function(a){return b.normalize(a)});if(a.type==="touchstart")o(e,function(a,b){d[b]={chartX:a.chartX,chartY:a.chartY}}),g.x=[d[0].chartX,d[1]&&d[1].chartX],g.y=[d[0].chartY,d[1]&&
d[1].chartY],o(c.axes,function(a){if(a.zoomEnabled){var b=c.bounds[a.horiz?"h":"v"],d=a.minPixelPadding,e=a.toPixels(q(a.options.min,a.dataMin)),f=a.toPixels(q(a.options.max,a.dataMax)),g=G(e,f),e=w(e,f);b.min=G(a.pos,g-d);b.max=w(a.pos+a.len,e+d)}}),b.res=!0;else if(d.length){if(!i)b.selectionMarker=i=A({destroy:ra,touch:!0},c.plotBox);b.pinchTranslate(d,e,j,i,l,g);b.hasPinched=h;b.scaleGroups(j,l);if(!h&&b.followTouchMove&&f===1)this.runPointActions(b.normalize(a));else if(b.res)b.res=!1,this.reset(!1,
0)}},touch:function(a,b){var c=this.chart,d;oa=c.index;if(a.touches.length===1)if(a=this.normalize(a),c.isInsidePlot(a.chartX-c.plotLeft,a.chartY-c.plotTop)&&!c.openMenu){b&&this.runPointActions(a);if(a.type==="touchmove")c=this.pinchDown,d=c[0]?Math.sqrt(Math.pow(c[0].chartX-a.chartX,2)+Math.pow(c[0].chartY-a.chartY,2))>=4:!1;q(d,!0)&&this.pinch(a)}else b&&this.reset();else a.touches.length===2&&this.pinch(a)},onContainerTouchStart:function(a){this.touch(a,!0)},onContainerTouchMove:function(a){this.touch(a)},
onDocumentTouchEnd:function(a){$[oa]&&$[oa].pointer.drop(a)}});if(L.PointerEvent||L.MSPointerEvent){var Ga={},Mb=!!L.PointerEvent,ac=function(){var a,b=[];b.item=function(a){return this[a]};for(a in Ga)Ga.hasOwnProperty(a)&&b.push({pageX:Ga[a].pageX,pageY:Ga[a].pageY,target:Ga[a].target});return b},Nb=function(a,b,c,d){if((a.pointerType==="touch"||a.pointerType===a.MSPOINTER_TYPE_TOUCH)&&$[oa])d(a),d=$[oa].pointer,d[b]({type:c,target:a.currentTarget,preventDefault:ra,touches:ac()})};A(Ya.prototype,
{onContainerPointerDown:function(a){Nb(a,"onContainerTouchStart","touchstart",function(a){Ga[a.pointerId]={pageX:a.pageX,pageY:a.pageY,target:a.currentTarget}})},onContainerPointerMove:function(a){Nb(a,"onContainerTouchMove","touchmove",function(a){Ga[a.pointerId]={pageX:a.pageX,pageY:a.pageY};if(!Ga[a.pointerId].target)Ga[a.pointerId].target=a.currentTarget})},onDocumentPointerUp:function(a){Nb(a,"onDocumentTouchEnd","touchend",function(a){delete Ga[a.pointerId]})},batchMSEvents:function(a){a(this.chart.container,
Mb?"pointerdown":"MSPointerDown",this.onContainerPointerDown);a(this.chart.container,Mb?"pointermove":"MSPointerMove",this.onContainerPointerMove);a(H,Mb?"pointerup":"MSPointerUp",this.onDocumentPointerUp)}});U(Ya.prototype,"init",function(a,b,c){a.call(this,b,c);this.hasZoom&&N(b.container,{"-ms-touch-action":"none","touch-action":"none"})});U(Ya.prototype,"setDOMEvents",function(a){a.apply(this);(this.hasZoom||this.followTouchMove)&&this.batchMSEvents(E)});U(Ya.prototype,"destroy",function(a){this.batchMSEvents(T);
a.call(this)})}var ub=B.Legend=function(a,b){this.init(a,b)};ub.prototype={init:function(a,b){var c=this,d=b.itemStyle,e=b.itemMarginTop||0;this.options=b;if(b.enabled)c.itemStyle=d,c.itemHiddenStyle=z(d,b.itemHiddenStyle),c.itemMarginTop=e,c.padding=d=q(b.padding,8),c.initialItemX=d,c.initialItemY=d-5,c.maxItemWidth=0,c.chart=a,c.itemHeight=0,c.symbolWidth=q(b.symbolWidth,16),c.pages=[],c.render(),E(c.chart,"endResize",function(){c.positionCheckboxes()})},colorizeItem:function(a,b){var c=this.options,
d=a.legendItem,e=a.legendLine,f=a.legendSymbol,g=this.itemHiddenStyle.color,c=b?c.itemStyle.color:g,h=b?a.legendColor||a.color||"#CCC":g,g=a.options&&a.options.marker,i={fill:h},j;d&&d.css({fill:c,color:c});e&&e.attr({stroke:h});if(f){if(g&&f.isMarker)for(j in i.stroke=h,g=a.convertAttribs(g),g)d=g[j],d!==t&&(i[j]=d);f.attr(i)}},positionItem:function(a){var b=this.options,c=b.symbolPadding,b=!b.rtl,d=a._legendItemPos,e=d[0],d=d[1],f=a.checkbox;(a=a.legendGroup)&&a.element&&a.translate(b?e:this.legendWidth-
e-2*c-4,d);if(f)f.x=e,f.y=d},destroyItem:function(a){var b=a.checkbox;o(["legendItem","legendLine","legendSymbol","legendGroup"],function(b){a[b]&&(a[b]=a[b].destroy())});b&&Ua(a.checkbox)},destroy:function(){var a=this.group,b=this.box;if(b)this.box=b.destroy();if(a)this.group=a.destroy()},positionCheckboxes:function(a){var b=this.group.alignAttr,c,d=this.clipHeight||this.legendHeight,e=this.titleHeight;if(b)c=b.translateY,o(this.allItems,function(f){var g=f.checkbox,h;g&&(h=c+e+g.y+(a||0)+3,N(g,
{left:b.translateX+f.checkboxOffset+g.x-20+"px",top:h+"px",display:h>c-6&&h<c+d-6?"":"none"}))})},renderTitle:function(){var a=this.padding,b=this.options.title,c=0;if(b.text){if(!this.title)this.title=this.chart.renderer.label(b.text,a-3,a-4,null,null,null,null,null,"legend-title").attr({zIndex:1}).css(b.style).add(this.group);a=this.title.getBBox();c=a.height;this.offsetWidth=a.width;this.contentGroup.attr({translateY:c})}this.titleHeight=c},setText:function(a){var b=this.options;a.legendItem.attr({text:b.labelFormat?
La(b.labelFormat,a):b.labelFormatter.call(a)})},renderItem:function(a){var b=this.chart,c=b.renderer,d=this.options,e=d.layout==="horizontal",f=this.symbolWidth,g=d.symbolPadding,h=this.itemStyle,i=this.itemHiddenStyle,j=this.padding,k=e?q(d.itemDistance,20):0,l=!d.rtl,m=d.width,n=d.itemMarginBottom||0,p=this.itemMarginTop,r=this.initialItemX,s=a.legendItem,o=a.series&&a.series.drawLegendSymbol?a.series:a,u=o.options,u=this.createCheckboxForItem&&u&&u.showCheckbox,x=d.useHTML;if(!s){a.legendGroup=
c.g("legend-item").attr({zIndex:1}).add(this.scrollGroup);a.legendItem=s=c.text("",l?f+g:-g,this.baseline||0,x).css(z(a.visible?h:i)).attr({align:l?"left":"right",zIndex:2}).add(a.legendGroup);if(!this.baseline)this.fontMetrics=c.fontMetrics(h.fontSize,s),this.baseline=this.fontMetrics.f+3+p,s.attr("y",this.baseline);o.drawLegendSymbol(this,a);this.setItemEvents&&this.setItemEvents(a,s,x,h,i);u&&this.createCheckboxForItem(a)}this.colorizeItem(a,a.visible);this.setText(a);c=s.getBBox();f=a.checkboxOffset=
d.itemWidth||a.legendItemWidth||f+g+c.width+k+(u?20:0);this.itemHeight=g=y(a.legendItemHeight||c.height);if(e&&this.itemX-r+f>(m||b.chartWidth-2*j-r-d.x))this.itemX=r,this.itemY+=p+this.lastLineHeight+n,this.lastLineHeight=0;this.maxItemWidth=w(this.maxItemWidth,f);this.lastItemY=p+this.itemY+n;this.lastLineHeight=w(g,this.lastLineHeight);a._legendItemPos=[this.itemX,this.itemY];e?this.itemX+=f:(this.itemY+=p+g+n,this.lastLineHeight=g);this.offsetWidth=m||w((e?this.itemX-r-k:f)+j,this.offsetWidth)},
getAllItems:function(){var a=[];o(this.chart.series,function(b){var c=b.options;if(q(c.showInLegend,!v(c.linkedTo)?t:!1,!0))a=a.concat(b.legendItems||(c.legendType==="point"?b.data:b))});return a},adjustMargins:function(a,b){var c=this.chart,d=this.options,e=d.align.charAt(0)+d.verticalAlign.charAt(0)+d.layout.charAt(0);this.display&&!d.floating&&o([/(lth|ct|rth)/,/(rtv|rm|rbv)/,/(rbh|cb|lbh)/,/(lbv|lm|ltv)/],function(f,g){f.test(e)&&!v(a[g])&&(c[tb[g]]=w(c[tb[g]],c.legend[(g+1)%2?"legendHeight":
"legendWidth"]+[1,-1,-1,1][g]*d[g%2?"x":"y"]+q(d.margin,12)+b[g]))})},render:function(){var a=this,b=a.chart,c=b.renderer,d=a.group,e,f,g,h,i=a.box,j=a.options,k=a.padding,l=j.borderWidth,m=j.backgroundColor;a.itemX=a.initialItemX;a.itemY=a.initialItemY;a.offsetWidth=0;a.lastItemY=0;if(!d)a.group=d=c.g("legend").attr({zIndex:7}).add(),a.contentGroup=c.g().attr({zIndex:1}).add(d),a.scrollGroup=c.g().add(a.contentGroup);a.renderTitle();e=a.getAllItems();nb(e,function(a,b){return(a.options&&a.options.legendIndex||
0)-(b.options&&b.options.legendIndex||0)});j.reversed&&e.reverse();a.allItems=e;a.display=f=!!e.length;a.lastLineHeight=0;o(e,function(b){a.renderItem(b)});g=(j.width||a.offsetWidth)+k;h=a.lastItemY+a.lastLineHeight+a.titleHeight;h=a.handleOverflow(h);h+=k;if(l||m){if(i){if(g>0&&h>0)i[i.isNew?"attr":"animate"](i.crisp({width:g,height:h})),i.isNew=!1}else a.box=i=c.rect(0,0,g,h,j.borderRadius,l||0).attr({stroke:j.borderColor,"stroke-width":l||0,fill:m||"none"}).add(d).shadow(j.shadow),i.isNew=!0;i[f?
"show":"hide"]()}a.legendWidth=g;a.legendHeight=h;o(e,function(b){a.positionItem(b)});f&&d.align(A({width:g,height:h},j),!0,"spacingBox");b.isResizing||this.positionCheckboxes()},handleOverflow:function(a){var b=this,c=this.chart,d=c.renderer,e=this.options,f=e.y,f=c.spacingBox.height+(e.verticalAlign==="top"?-f:f)-this.padding,g=e.maxHeight,h,i=this.clipRect,j=e.navigation,k=q(j.animation,!0),l=j.arrowSize||12,m=this.nav,n=this.pages,p=this.padding,r,s=this.allItems,F=function(a){i.attr({height:a});
if(b.contentGroup.div)b.contentGroup.div.style.clip="rect("+p+"px,9999px,"+(p+a)+"px,0)"};e.layout==="horizontal"&&(f/=2);g&&(f=G(f,g));n.length=0;if(a>f&&j.enabled!==!1){this.clipHeight=h=w(f-20-this.titleHeight-p,0);this.currentPage=q(this.currentPage,1);this.fullHeight=a;o(s,function(a,b){var c=a._legendItemPos[1],d=y(a.legendItem.getBBox().height),e=n.length;if(!e||c-n[e-1]>h&&(r||c)!==n[e-1])n.push(r||c),e++;b===s.length-1&&c+d-n[e-1]>h&&n.push(c);c!==r&&(r=c)});if(!i)i=b.clipRect=d.clipRect(0,
p,9999,0),b.contentGroup.clip(i);F(h);if(!m)this.nav=m=d.g().attr({zIndex:1}).add(this.group),this.up=d.symbol("triangle",0,0,l,l).on("click",function(){b.scroll(-1,k)}).add(m),this.pager=d.text("",15,10).css(j.style).add(m),this.down=d.symbol("triangle-down",0,0,l,l).on("click",function(){b.scroll(1,k)}).add(m);b.scroll(0);a=f}else if(m)F(c.chartHeight),m.hide(),this.scrollGroup.attr({translateY:1}),this.clipHeight=0;return a},scroll:function(a,b){var c=this.pages,d=c.length,e=this.currentPage+a,
f=this.clipHeight,g=this.options.navigation,h=g.activeColor,g=g.inactiveColor,i=this.pager,j=this.padding;e>d&&(e=d);if(e>0)b!==t&&$a(b,this.chart),this.nav.attr({translateX:j,translateY:f+this.padding+7+this.titleHeight,visibility:"visible"}),this.up.attr({fill:e===1?g:h}).css({cursor:e===1?"default":"pointer"}),i.attr({text:e+"/"+d}),this.down.attr({x:18+this.pager.getBBox().width,fill:e===d?g:h}).css({cursor:e===d?"default":"pointer"}),c=-c[e-1]+this.initialItemY,this.scrollGroup.animate({translateY:c}),
this.currentPage=e,this.positionCheckboxes(c)}};aa=B.LegendSymbolMixin={drawRectangle:function(a,b){var c=a.options.symbolHeight||a.fontMetrics.f;b.legendSymbol=this.chart.renderer.rect(0,a.baseline-c+1,a.symbolWidth,c,a.options.symbolRadius||0).attr({zIndex:3}).add(b.legendGroup)},drawLineMarker:function(a){var b=this.options,c=b.marker,d=a.symbolWidth,e=this.chart.renderer,f=this.legendGroup,a=a.baseline-y(a.fontMetrics.b*0.3),g;if(b.lineWidth){g={"stroke-width":b.lineWidth};if(b.dashStyle)g.dashstyle=
b.dashStyle;this.legendLine=e.path(["M",0,a,"L",d,a]).attr(g).add(f)}if(c&&c.enabled!==!1)b=c.radius,this.legendSymbol=c=e.symbol(this.symbol,d/2-b,a-b,2*b,2*b,c).add(f),c.isMarker=!0}};(/Trident\/7\.0/.test(Na)||Wa)&&U(ub.prototype,"positionItem",function(a,b){var c=this,d=function(){b._legendItemPos&&a.call(c,b)};d();setTimeout(d)});var Ba=B.Chart=function(){this.getArgs.apply(this,arguments)};B.chart=function(a,b,c){return new Ba(a,b,c)};Ba.prototype={callbacks:[],getArgs:function(){var a=[].slice.call(arguments);
if(Ca(a[0])||a[0].nodeName)this.renderTo=a.shift();this.init(a[0],a[1])},init:function(a,b){var c,d=a.series;a.series=null;c=z(R,a);c.series=a.series=d;this.userOptions=a;d=c.chart;this.margin=this.splashArray("margin",d);this.spacing=this.splashArray("spacing",d);var e=d.events;this.bounds={h:{},v:{}};this.callback=b;this.isResizing=0;this.options=c;this.axes=[];this.series=[];this.hasCartesianSeries=d.showAxes;var f=this,g;f.index=$.length;$.push(f);kb++;d.reflow!==!1&&E(f,"load",function(){f.initReflow()});
if(e)for(g in e)E(f,g,e[g]);f.xAxis=[];f.yAxis=[];f.animation=qa?!1:q(d.animation,!0);f.pointCount=f.colorCounter=f.symbolCounter=0;f.firstRender()},initSeries:function(a){var b=this.options.chart;(b=I[a.type||b.type||b.defaultSeriesType])||ga(17,!0);b=new b;b.init(this,a);return b},isInsidePlot:function(a,b,c){var d=c?b:a,a=c?a:b;return d>=0&&d<=this.plotWidth&&a>=0&&a<=this.plotHeight},redraw:function(a){var b=this.axes,c=this.series,d=this.pointer,e=this.legend,f=this.isDirtyLegend,g,h,i=this.hasCartesianSeries,
j=this.isDirtyBox,k=c.length,l=k,m=this.renderer,n=m.isHidden(),p=[];$a(a,this);n&&this.cloneRenderTo();for(this.layOutTitles();l--;)if(a=c[l],a.options.stacking&&(g=!0,a.isDirty)){h=!0;break}if(h)for(l=k;l--;)if(a=c[l],a.options.stacking)a.isDirty=!0;o(c,function(a){a.isDirty&&a.options.legendType==="point"&&(a.updateTotals&&a.updateTotals(),f=!0);a.isDirtyData&&O(a,"updatedData")});if(f&&e.options.enabled)e.render(),this.isDirtyLegend=!1;g&&this.getStacks();if(i&&!this.isResizing)this.maxTicks=
null,o(b,function(a){a.setScale()});this.getMargins();i&&(o(b,function(a){a.isDirty&&(j=!0)}),o(b,function(a){var b=a.min+","+a.max;if(a.extKey!==b)a.extKey=b,p.push(function(){O(a,"afterSetExtremes",A(a.eventArgs,a.getExtremes()));delete a.eventArgs});(j||g)&&a.redraw()}));j&&this.drawChartBox();o(c,function(a){a.isDirty&&a.visible&&(!a.isCartesian||a.xAxis)&&a.redraw()});d&&d.reset(!0);m.draw();O(this,"redraw");n&&this.cloneRenderTo(!0);o(p,function(a){a.call()})},get:function(a){var b=this.axes,
c=this.series,d,e;for(d=0;d<b.length;d++)if(b[d].options.id===a)return b[d];for(d=0;d<c.length;d++)if(c[d].options.id===a)return c[d];for(d=0;d<c.length;d++){e=c[d].points||[];for(b=0;b<e.length;b++)if(e[b].id===a)return e[b]}return null},getAxes:function(){var a=this,b=this.options,c=b.xAxis=ua(b.xAxis||{}),b=b.yAxis=ua(b.yAxis||{});o(c,function(a,b){a.index=b;a.isX=!0});o(b,function(a,b){a.index=b});c=c.concat(b);o(c,function(b){new J(a,b)})},getSelectedPoints:function(){var a=[];o(this.series,
function(b){a=a.concat(Fa(b.points||[],function(a){return a.selected}))});return a},getSelectedSeries:function(){return Fa(this.series,function(a){return a.selected})},setTitle:function(a,b,c){var g;var d=this,e=d.options,f;f=e.title=z(e.title,a);g=e.subtitle=z(e.subtitle,b),e=g;o([["title",a,f],["subtitle",b,e]],function(a){var b=a[0],c=d[b],e=a[1],a=a[2];c&&e&&(d[b]=c=c.destroy());a&&a.text&&!c&&(d[b]=d.renderer.text(a.text,0,0,a.useHTML).attr({align:a.align,"class":"highcharts-"+b,zIndex:a.zIndex||
4}).css(a.style).add())});d.layOutTitles(c)},layOutTitles:function(a){var b=0,c=this.title,d=this.subtitle,e=this.options,f=e.title,e=e.subtitle,g=this.renderer,h=this.spacingBox;if(c&&(c.css({width:(f.width||h.width+f.widthAdjust)+"px"}).align(A({y:g.fontMetrics(f.style.fontSize,c).b-3},f),!1,h),!f.floating&&!f.verticalAlign))b=c.getBBox().height;d&&(d.css({width:(e.width||h.width+e.widthAdjust)+"px"}).align(A({y:b+(f.margin-13)+g.fontMetrics(e.style.fontSize,c).b},e),!1,h),!e.floating&&!e.verticalAlign&&
(b=Ea(b+d.getBBox().height)));c=this.titleOffset!==b;this.titleOffset=b;if(!this.isDirtyBox&&c)this.isDirtyBox=c,this.hasRendered&&q(a,!0)&&this.isDirtyBox&&this.redraw()},getChartSize:function(){var a=this.options.chart,b=a.width,a=a.height,c=this.renderToClone||this.renderTo;if(!v(b))this.containerWidth=wa(c,"width");if(!v(a))this.containerHeight=wa(c,"height");this.chartWidth=w(0,b||this.containerWidth||600);this.chartHeight=w(0,q(a,this.containerHeight>19?this.containerHeight:400))},cloneRenderTo:function(a){var b=
this.renderToClone,c=this.container;a?b&&(this.renderTo.appendChild(c),Ua(b),delete this.renderToClone):(c&&c.parentNode===this.renderTo&&this.renderTo.removeChild(c),this.renderToClone=b=this.renderTo.cloneNode(0),N(b,{position:"absolute",top:"-9999px",display:"block"}),b.style.setProperty&&b.style.setProperty("display","block","important"),H.body.appendChild(b),c&&b.appendChild(c))},getContainer:function(){var a,b=this.options,c=b.chart,d,e;a=this.renderTo;var f="highcharts-"+Ib++;if(!a)this.renderTo=
a=c.renderTo;if(Ca(a))this.renderTo=a=H.getElementById(a);a||ga(13,!0);d=K(X(a,"data-highcharts-chart"));C(d)&&$[d]&&$[d].hasRendered&&$[d].destroy();X(a,"data-highcharts-chart",this.index);a.innerHTML="";!c.skipClone&&!a.offsetWidth&&this.cloneRenderTo();this.getChartSize();d=this.chartWidth;e=this.chartHeight;this.container=a=fa(Va,{className:"highcharts-container"+(c.className?" "+c.className:""),id:f},A({position:"relative",overflow:"hidden",width:d+"px",height:e+"px",textAlign:"left",lineHeight:"normal",
zIndex:0,"-webkit-tap-highlight-color":"rgba(0,0,0,0)"},c.style),this.renderToClone||a);this._cursor=a.style.cursor;this.renderer=new (B[c.renderer]||Xa)(a,d,e,c.style,c.forExport,b.exporting&&b.exporting.allowHTML);qa&&this.renderer.create(this,a,d,e);this.renderer.chartIndex=this.index},getMargins:function(a){var b=this.spacing,c=this.margin,d=this.titleOffset;this.resetMargins();if(d&&!v(c[0]))this.plotTop=w(this.plotTop,d+this.options.title.margin+b[0]);this.legend.adjustMargins(c,b);this.extraBottomMargin&&
(this.marginBottom+=this.extraBottomMargin);this.extraTopMargin&&(this.plotTop+=this.extraTopMargin);a||this.getAxisMargins()},getAxisMargins:function(){var a=this,b=a.axisOffset=[0,0,0,0],c=a.margin;a.hasCartesianSeries&&o(a.axes,function(a){a.visible&&a.getOffset()});o(tb,function(d,e){v(c[e])||(a[d]+=b[e])});a.setChartSize()},reflow:function(a){var b=this,c=b.options.chart,d=b.renderTo,e=c.width||wa(d,"width"),f=c.height||wa(d,"height"),c=a?a.target:L;if(!b.hasUserSize&&!b.isPrinting&&e&&f&&(c===
L||c===H)){if(e!==b.containerWidth||f!==b.containerHeight)clearTimeout(b.reflowTimeout),b.reflowTimeout=Za(function(){if(b.container)b.setSize(e,f,!1),b.hasUserSize=null},a?100:0);b.containerWidth=e;b.containerHeight=f}},initReflow:function(){var a=this,b=function(b){a.reflow(b)};E(L,"resize",b);E(a,"destroy",function(){T(L,"resize",b)})},setSize:function(a,b,c){var d=this,e,f,g=d.renderer;d.isResizing+=1;$a(c,d);d.oldChartHeight=d.chartHeight;d.oldChartWidth=d.chartWidth;if(v(a))d.chartWidth=e=w(0,
y(a)),d.hasUserSize=!!e;if(v(b))d.chartHeight=f=w(0,y(b));a=g.globalAnimation;(a?db:N)(d.container,{width:e+"px",height:f+"px"},a);d.setChartSize(!0);g.setSize(e,f,c);d.maxTicks=null;o(d.axes,function(a){a.isDirty=!0;a.setScale()});o(d.series,function(a){a.isDirty=!0});d.isDirtyLegend=!0;d.isDirtyBox=!0;d.layOutTitles();d.getMargins();d.redraw(c);d.oldChartHeight=null;O(d,"resize");Za(function(){d&&O(d,"endResize",null,function(){d.isResizing-=1})},gb(a).duration)},setChartSize:function(a){var b=
this.inverted,c=this.renderer,d=this.chartWidth,e=this.chartHeight,f=this.options.chart,g=this.spacing,h=this.clipOffset,i,j,k,l;this.plotLeft=i=y(this.plotLeft);this.plotTop=j=y(this.plotTop);this.plotWidth=k=w(0,y(d-i-this.marginRight));this.plotHeight=l=w(0,y(e-j-this.marginBottom));this.plotSizeX=b?l:k;this.plotSizeY=b?k:l;this.plotBorderWidth=f.plotBorderWidth||0;this.spacingBox=c.spacingBox={x:g[3],y:g[0],width:d-g[3]-g[1],height:e-g[0]-g[2]};this.plotBox=c.plotBox={x:i,y:j,width:k,height:l};
d=2*V(this.plotBorderWidth/2);b=Ea(w(d,h[3])/2);c=Ea(w(d,h[0])/2);this.clipBox={x:b,y:c,width:V(this.plotSizeX-w(d,h[1])/2-b),height:w(0,V(this.plotSizeY-w(d,h[2])/2-c))};a||o(this.axes,function(a){a.setAxisSize();a.setAxisTranslation()})},resetMargins:function(){var a=this;o(tb,function(b,c){a[b]=q(a.margin[c],a.spacing[c])});a.axisOffset=[0,0,0,0];a.clipOffset=[0,0,0,0]},drawChartBox:function(){var a=this.options.chart,b=this.renderer,c=this.chartWidth,d=this.chartHeight,e=this.chartBackground,
f=this.plotBackground,g=this.plotBorder,h=this.plotBGImage,i=a.borderWidth||0,j=a.backgroundColor,k=a.plotBackgroundColor,l=a.plotBackgroundImage,m=a.plotBorderWidth||0,n,p=this.plotLeft,r=this.plotTop,s=this.plotWidth,q=this.plotHeight,o=this.plotBox,x=this.clipRect,D=this.clipBox;n=i+(a.shadow?8:0);if(i||j)if(e)e.animate(e.crisp({width:c-n,height:d-n}));else{e={fill:j||"none"};if(i)e.stroke=a.borderColor,e["stroke-width"]=i;this.chartBackground=b.rect(n/2,n/2,c-n,d-n,a.borderRadius,i).attr(e).addClass("highcharts-background").add().shadow(a.shadow)}if(k)f?
f.animate(o):this.plotBackground=b.rect(p,r,s,q,0).attr({fill:k}).add().shadow(a.plotShadow);if(l)h?h.animate(o):this.plotBGImage=b.image(l,p,r,s,q).add();x?x.animate({width:D.width,height:D.height}):this.clipRect=b.clipRect(D);if(m)g?(g.strokeWidth=-m,g.animate(g.crisp({x:p,y:r,width:s,height:q}))):this.plotBorder=b.rect(p,r,s,q,0,-m).attr({stroke:a.plotBorderColor,"stroke-width":m,fill:"none",zIndex:1}).add();this.isDirtyBox=!1},propFromSeries:function(){var a=this,b=a.options.chart,c,d=a.options.series,
e,f;o(["inverted","angular","polar"],function(g){c=I[b.type||b.defaultSeriesType];f=a[g]||b[g]||c&&c.prototype[g];for(e=d&&d.length;!f&&e--;)(c=I[d[e].type])&&c.prototype[g]&&(f=!0);a[g]=f})},linkSeries:function(){var a=this,b=a.series;o(b,function(a){a.linkedSeries.length=0});o(b,function(b){var d=b.options.linkedTo;if(Ca(d)&&(d=d===":previous"?a.series[b.index-1]:a.get(d)))d.linkedSeries.push(b),b.linkedParent=d,b.visible=q(b.options.visible,d.options.visible,b.visible)})},renderSeries:function(){o(this.series,
function(a){a.translate();a.render()})},renderLabels:function(){var a=this,b=a.options.labels;b.items&&o(b.items,function(c){var d=A(b.style,c.style),e=K(d.left)+a.plotLeft,f=K(d.top)+a.plotTop+12;delete d.left;delete d.top;a.renderer.text(c.html,e,f).attr({zIndex:2}).css(d).add()})},render:function(){var a=this.axes,b=this.renderer,c=this.options,d,e,f,g;this.setTitle();this.legend=new ub(this,c.legend);this.getStacks&&this.getStacks();this.getMargins(!0);this.setChartSize();d=this.plotWidth;e=this.plotHeight-=
21;o(a,function(a){a.setScale()});this.getAxisMargins();f=d/this.plotWidth>1.1;g=e/this.plotHeight>1.05;if(f||g)this.maxTicks=null,o(a,function(a){(a.horiz&&f||!a.horiz&&g)&&a.setTickInterval(!0)}),this.getMargins();this.drawChartBox();this.hasCartesianSeries&&o(a,function(a){a.visible&&a.render()});if(!this.seriesGroup)this.seriesGroup=b.g("series-group").attr({zIndex:3}).add();this.renderSeries();this.renderLabels();this.showCredits(c.credits);this.hasRendered=!0},showCredits:function(a){if(a.enabled&&
!this.credits)this.credits=this.renderer.text(a.text,0,0).on("click",function(){if(a.href)L.location.href=a.href}).attr({align:a.position.align,zIndex:8}).css(a.style).add().align(a.position)},destroy:function(){var a=this,b=a.axes,c=a.series,d=a.container,e,f=d&&d.parentNode;O(a,"destroy");$[a.index]=t;kb--;a.renderTo.removeAttribute("data-highcharts-chart");T(a);for(e=b.length;e--;)b[e]=b[e].destroy();for(e=c.length;e--;)c[e]=c[e].destroy();o("title,subtitle,chartBackground,plotBackground,plotBGImage,plotBorder,seriesGroup,clipRect,credits,pointer,scroller,rangeSelector,legend,resetZoomButton,tooltip,renderer".split(","),
function(b){var c=a[b];c&&c.destroy&&(a[b]=c.destroy())});if(d)d.innerHTML="",T(d),f&&Ua(d);for(e in a)delete a[e]},isReadyToRender:function(){var a=this;return!ja&&L==L.top&&H.readyState!=="complete"||qa&&!L.canvg?(qa?Wb.push(function(){a.firstRender()},a.options.global.canvasToolsURL):H.attachEvent("onreadystatechange",function(){H.detachEvent("onreadystatechange",a.firstRender);H.readyState==="complete"&&a.firstRender()}),!1):!0},firstRender:function(){var a=this,b=a.options;if(a.isReadyToRender()){a.getContainer();
O(a,"init");a.resetMargins();a.setChartSize();a.propFromSeries();a.getAxes();o(b.series||[],function(b){a.initSeries(b)});a.linkSeries();O(a,"beforeRender");if(B.Pointer)a.pointer=new Ya(a,b);a.render();a.renderer.draw();if(!a.renderer.imgCount&&a.onload)a.onload();a.cloneRenderTo(!0)}},onload:function(){var a=this;o([this.callback].concat(this.callbacks),function(b){b&&a.index!==void 0&&b.apply(a,[a])});O(a,"load");this.onload=null},splashArray:function(a,b){var c=b[a],c=ea(c)?c:[c,c,c,c];return[q(b[a+
"Top"],c[0]),q(b[a+"Right"],c[1]),q(b[a+"Bottom"],c[2]),q(b[a+"Left"],c[3])]}};var bc=B.CenteredSeriesMixin={getCenter:function(){var a=this.options,b=this.chart,c=2*(a.slicedOffset||0),d=b.plotWidth-2*c,b=b.plotHeight-2*c,e=a.center,e=[q(e[0],"50%"),q(e[1],"50%"),a.size||"100%",a.innerSize||0],f=G(d,b),g,h;for(g=0;g<4;++g)h=e[g],a=g<2||g===2&&/%$/.test(h),e[g]=(/%$/.test(h)?[d,b,f,e[2]][g]*parseFloat(h)/100:parseFloat(h))+(a?c:0);e[3]>e[2]&&(e[3]=e[2]);return e}},Ha=function(){};Ha.prototype={init:function(a,
b,c){this.series=a;this.color=a.color;this.applyOptions(b,c);this.pointAttr={};if(a.options.colorByPoint&&(b=a.options.colors||a.chart.options.colors,this.color=this.color||b[a.colorCounter++],a.colorCounter===b.length))a.colorCounter=0;a.chart.pointCount++;return this},applyOptions:function(a,b){var c=this.series,d=c.options.pointValKey||c.pointValKey,a=Ha.prototype.optionsToObject.call(this,a);A(this,a);this.options=this.options?A(this.options,a):a;if(d)this.y=this[d];this.isNull=this.x===null||
this.y===null;if(this.x===void 0&&c)this.x=b===void 0?c.autoIncrement():b;return this},optionsToObject:function(a){var b={},c=this.series,d=c.options.keys,e=d||c.pointArrayMap||["y"],f=e.length,g=0,h=0;if(C(a)||a===null)b[e[0]]=a;else if(Ja(a)){if(!d&&a.length>f){c=typeof a[0];if(c==="string")b.name=a[0];else if(c==="number")b.x=a[0];g++}for(;h<f;){if(!d||a[g]!==void 0)b[e[h]]=a[g];g++;h++}}else if(typeof a==="object"){b=a;if(a.dataLabels)c._hasPointLabels=!0;if(a.marker)c._hasPointMarkers=!0}return b},
destroy:function(){var a=this.series.chart,b=a.hoverPoints,c;a.pointCount--;if(b&&(this.setState(),za(b,this),!b.length))a.hoverPoints=null;if(this===a.hoverPoint)this.onMouseOut();if(this.graphic||this.dataLabel)T(this),this.destroyElements();this.legendItem&&a.legend.destroyItem(this);for(c in this)this[c]=null},destroyElements:function(){for(var a=["graphic","dataLabel","dataLabelUpper","connector","shadowGroup"],b,c=6;c--;)b=a[c],this[b]&&(this[b]=this[b].destroy())},getLabelConfig:function(){return{x:this.category,
y:this.y,color:this.color,key:this.name||this.category,series:this.series,point:this,percentage:this.percentage,total:this.total||this.stackTotal}},tooltipFormatter:function(a){var b=this.series,c=b.tooltipOptions,d=q(c.valueDecimals,""),e=c.valuePrefix||"",f=c.valueSuffix||"";o(b.pointArrayMap||["y"],function(b){b="{point."+b;if(e||f)a=a.replace(b+"}",e+b+"}"+f);a=a.replace(b+"}",b+":,."+d+"f}")});return La(a,{point:this,series:this.series})},firePointEvent:function(a,b,c){var d=this,e=this.series.options;
(e.point.events[a]||d.options&&d.options.events&&d.options.events[a])&&this.importEvents();a==="click"&&e.allowPointSelect&&(c=function(a){d.select&&d.select(null,a.ctrlKey||a.metaKey||a.shiftKey)});O(this,a,b,c)},visible:!0};var P=B.Series=function(){};P.prototype={isCartesian:!0,type:"line",pointClass:Ha,sorted:!0,requireSorting:!0,pointAttrToOptions:{stroke:"lineColor","stroke-width":"lineWidth",fill:"fillColor",r:"radius"},directTouch:!1,axisTypes:["xAxis","yAxis"],colorCounter:0,parallelArrays:["x",
"y"],init:function(a,b){var c=this,d,e,f=a.series,g=function(a,b){return q(a.options.index,a._i)-q(b.options.index,b._i)};c.chart=a;c.options=b=c.setOptions(b);c.linkedSeries=[];c.bindAxes();A(c,{name:b.name,state:"",pointAttr:{},visible:b.visible!==!1,selected:b.selected===!0});if(qa)b.animation=!1;e=b.events;for(d in e)E(c,d,e[d]);if(e&&e.click||b.point&&b.point.events&&b.point.events.click||b.allowPointSelect)a.runTrackerClick=!0;c.getColor();c.getSymbol();o(c.parallelArrays,function(a){c[a+"Data"]=
[]});c.setData(b.data,!1);if(c.isCartesian)a.hasCartesianSeries=!0;f.push(c);c._i=f.length-1;nb(f,g);this.yAxis&&nb(this.yAxis.series,g);o(f,function(a,b){a.index=b;a.name=a.name||"Series "+(b+1)})},bindAxes:function(){var a=this,b=a.options,c=a.chart,d;o(a.axisTypes||[],function(e){o(c[e],function(c){d=c.options;if(b[e]===d.index||b[e]!==t&&b[e]===d.id||b[e]===t&&d.index===0)c.series.push(a),a[e]=c,c.isDirty=!0});!a[e]&&a.optionalAxis!==e&&ga(18,!0)})},updateParallelArrays:function(a,b){var c=a.series,
d=arguments,e=C(b)?function(d){var e=d==="y"&&c.toYData?c.toYData(a):a[d];c[d+"Data"][b]=e}:function(a){Array.prototype[b].apply(c[a+"Data"],Array.prototype.slice.call(d,2))};o(c.parallelArrays,e)},autoIncrement:function(){var a=this.options,b=this.xIncrement,c,d=a.pointIntervalUnit,b=q(b,a.pointStart,0);this.pointInterval=c=q(this.pointInterval,a.pointInterval,1);d&&(a=new ba(b),d==="day"?a=+a[qb](a[ab]()+c):d==="month"?a=+a[Eb](a[hb]()+c):d==="year"&&(a=+a[Fb](a[ib]()+c)),c=a-b);this.xIncrement=
b+c;return b},setOptions:function(a){var b=this.chart,c=b.options.plotOptions,b=b.userOptions||{},d=b.plotOptions||{},e=c[this.type];this.userOptions=a;c=z(e,c.series,a);this.tooltipOptions=z(R.tooltip,R.plotOptions[this.type].tooltip,b.tooltip,d.series&&d.series.tooltip,d[this.type]&&d[this.type].tooltip,a.tooltip);e.marker===null&&delete c.marker;this.zoneAxis=c.zoneAxis;a=this.zones=(c.zones||[]).slice();if((c.negativeColor||c.negativeFillColor)&&!c.zones)a.push({value:c[this.zoneAxis+"Threshold"]||
c.threshold||0,color:c.negativeColor,fillColor:c.negativeFillColor});a.length&&v(a[a.length-1].value)&&a.push({color:this.color,fillColor:this.fillColor});return c},getCyclic:function(a,b,c){var d=this.userOptions,e="_"+a+"Index",f=a+"Counter";b||(v(d[e])?b=d[e]:(d[e]=b=this.chart[f]%c.length,this.chart[f]+=1),b=c[b]);this[a]=b},getColor:function(){this.options.colorByPoint?this.options.color=null:this.getCyclic("color",this.options.color||W[this.type].color,this.chart.options.colors)},getSymbol:function(){var a=
this.options.marker;this.getCyclic("symbol",a.symbol,this.chart.options.symbols);if(/^url/.test(this.symbol))a.radius=0},drawLegendSymbol:aa.drawLineMarker,setData:function(a,b,c,d){var e=this,f=e.points,g=f&&f.length||0,h,i=e.options,j=e.chart,k=null,l=e.xAxis,m=l&&!!l.categories,n=i.turboThreshold,p=this.xData,r=this.yData,s=(h=e.pointArrayMap)&&h.length,a=a||[];h=a.length;b=q(b,!0);if(d!==!1&&h&&g===h&&!e.cropped&&!e.hasGroupedData&&e.visible)o(a,function(a,b){f[b].update&&a!==i.data[b]&&f[b].update(a,
!1,null,!1)});else{e.xIncrement=null;e.colorCounter=0;o(this.parallelArrays,function(a){e[a+"Data"].length=0});if(n&&h>n){for(c=0;k===null&&c<h;)k=a[c],c++;if(C(k)){m=q(i.pointStart,0);k=q(i.pointInterval,1);for(c=0;c<h;c++)p[c]=m,r[c]=a[c],m+=k;e.xIncrement=m}else if(Ja(k))if(s)for(c=0;c<h;c++)k=a[c],p[c]=k[0],r[c]=k.slice(1,s+1);else for(c=0;c<h;c++)k=a[c],p[c]=k[0],r[c]=k[1];else ga(12)}else for(c=0;c<h;c++)if(a[c]!==t&&(k={series:e},e.pointClass.prototype.applyOptions.apply(k,[a[c]]),e.updateParallelArrays(k,
c),m&&v(k.name)))l.names[k.x]=k.name;Ca(r[0])&&ga(14,!0);e.data=[];e.options.data=e.userOptions.data=a;for(c=g;c--;)f[c]&&f[c].destroy&&f[c].destroy();if(l)l.minRange=l.userMinRange;e.isDirty=e.isDirtyData=j.isDirtyBox=!0;c=!1}i.legendType==="point"&&(this.processData(),this.generatePoints());b&&j.redraw(c)},processData:function(a){var b=this.xData,c=this.yData,d=b.length,e;e=0;var f,g,h=this.xAxis,i,j=this.options;i=j.cropThreshold;var k=this.getExtremesFromAll||j.getExtremesFromAll,l=this.isCartesian,
j=h&&h.val2lin,m=h&&h.isLog,n,p;if(l&&!this.isDirty&&!h.isDirty&&!this.yAxis.isDirty&&!a)return!1;if(h)a=h.getExtremes(),n=a.min,p=a.max;if(l&&this.sorted&&!k&&(!i||d>i||this.forceCrop))if(b[d-1]<n||b[0]>p)b=[],c=[];else if(b[0]<n||b[d-1]>p)e=this.cropData(this.xData,this.yData,n,p),b=e.xData,c=e.yData,e=e.start,f=!0;for(i=b.length||1;--i;)d=m?j(b[i])-j(b[i-1]):b[i]-b[i-1],d>0&&(g===t||d<g)?g=d:d<0&&this.requireSorting&&ga(15);this.cropped=f;this.cropStart=e;this.processedXData=b;this.processedYData=
c;this.closestPointRange=g},cropData:function(a,b,c,d){var e=a.length,f=0,g=e,h=q(this.cropShoulder,1),i;for(i=0;i<e;i++)if(a[i]>=c){f=w(0,i-h);break}for(c=i;c<e;c++)if(a[c]>d){g=c+h;break}return{xData:a.slice(f,g),yData:b.slice(f,g),start:f,end:g}},generatePoints:function(){var a=this.options.data,b=this.data,c,d=this.processedXData,e=this.processedYData,f=this.pointClass,g=d.length,h=this.cropStart||0,i,j=this.hasGroupedData,k,l=[],m;if(!b&&!j)b=[],b.length=a.length,b=this.data=b;for(m=0;m<g;m++)i=
h+m,j?(l[m]=(new f).init(this,[d[m]].concat(ua(e[m]))),l[m].dataGroup=this.groupMap[m]):(b[i]?k=b[i]:a[i]!==t&&(b[i]=k=(new f).init(this,a[i],d[m])),l[m]=k),l[m].index=i;if(b&&(g!==(c=b.length)||j))for(m=0;m<c;m++)if(m===h&&!j&&(m+=g),b[m])b[m].destroyElements(),b[m].plotX=t;this.data=b;this.points=l},getExtremes:function(a){var b=this.yAxis,c=this.processedXData,d,e=[],f=0;d=this.xAxis.getExtremes();var g=d.min,h=d.max,i,j,k,l,a=a||this.stackedYData||this.processedYData||[];d=a.length;for(l=0;l<
d;l++)if(j=c[l],k=a[l],i=k!==null&&k!==t&&(!b.isLog||k.length||k>0),j=this.getExtremesFromAll||this.options.getExtremesFromAll||this.cropped||(c[l+1]||j)>=g&&(c[l-1]||j)<=h,i&&j)if(i=k.length)for(;i--;)k[i]!==null&&(e[f++]=k[i]);else e[f++]=k;this.dataMin=Ma(e);this.dataMax=Da(e)},translate:function(){this.processedXData||this.processData();this.generatePoints();for(var a=this.options,b=a.stacking,c=this.xAxis,d=c.categories,e=this.yAxis,f=this.points,g=f.length,h=!!this.modifyValue,i=a.pointPlacement,
j=i==="between"||C(i),k=a.threshold,l=a.startFromThreshold?k:0,m,n,p,r,s=Number.MAX_VALUE,a=0;a<g;a++){var o=f[a],u=o.x,x=o.y;n=o.low;var D=b&&e.stacks[(this.negStacks&&x<(l?0:k)?"-":"")+this.stackKey];if(e.isLog&&x!==null&&x<=0)o.y=x=null,ga(10);o.plotX=m=ka(G(w(-1E5,c.translate(u,0,0,0,1,i,this.type==="flags")),1E5));if(b&&this.visible&&!o.isNull&&D&&D[u])r=this.getStackIndicator(r,u,this.index),D=D[u],x=D.points[r.key],n=x[0],x=x[1],n===l&&(n=q(k,e.min)),e.isLog&&n<=0&&(n=null),o.total=o.stackTotal=
D.total,o.percentage=D.total&&o.y/D.total*100,o.stackY=x,D.setOffset(this.pointXOffset||0,this.barW||0);o.yBottom=v(n)?e.translate(n,0,1,0,1):null;h&&(x=this.modifyValue(x,o));o.plotY=n=typeof x==="number"&&x!==Infinity?G(w(-1E5,e.translate(x,0,1,0,1)),1E5):t;o.isInside=n!==t&&n>=0&&n<=e.len&&m>=0&&m<=c.len;o.clientX=j?c.translate(u,0,0,0,1):m;o.negative=o.y<(k||0);o.category=d&&d[o.x]!==t?d[o.x]:o.x;o.isNull||(p!==void 0&&(s=G(s,S(m-p))),p=m)}this.closestPointRangePx=s},getValidPoints:function(a,
b){var c=this.chart;return Fa(a||this.points||[],function(a){return b&&!c.isInsidePlot(a.plotX,a.plotY,c.inverted)?!1:!a.isNull})},setClip:function(a){var b=this.chart,c=this.options,d=b.renderer,e=b.inverted,f=this.clipBox,g=f||b.clipBox,h=this.sharedClipKey||["_sharedClip",a&&a.duration,a&&a.easing,g.height,c.xAxis,c.yAxis].join(","),i=b[h],j=b[h+"m"];if(!i){if(a)g.width=0,b[h+"m"]=j=d.clipRect(-99,e?-b.plotLeft:-b.plotTop,99,e?b.chartWidth:b.chartHeight);b[h]=i=d.clipRect(g)}a&&(i.count+=1);if(c.clip!==
!1)this.group.clip(a||f?i:b.clipRect),this.markerGroup.clip(j),this.sharedClipKey=h;a||(i.count-=1,i.count<=0&&h&&b[h]&&(f||(b[h]=b[h].destroy()),b[h+"m"]&&(b[h+"m"]=b[h+"m"].destroy())))},animate:function(a){var b=this.chart,c=this.options.animation,d;if(c&&!ea(c))c=W[this.type].animation;a?this.setClip(c):(d=this.sharedClipKey,(a=b[d])&&a.animate({width:b.plotSizeX},c),b[d+"m"]&&b[d+"m"].animate({width:b.plotSizeX+99},c),this.animate=null)},afterAnimate:function(){this.setClip();O(this,"afterAnimate")},
drawPoints:function(){var a,b=this.points,c=this.chart,d,e,f,g,h,i,j,k,l=this.options.marker,m=this.pointAttr[""],n,p,r,s=this.markerGroup,o=q(l.enabled,this.xAxis.isRadial,this.closestPointRangePx>2*l.radius);if(l.enabled!==!1||this._hasPointMarkers)for(f=b.length;f--;)if(g=b[f],d=V(g.plotX),e=g.plotY,k=g.graphic,n=g.marker||{},p=!!g.marker,a=o&&n.enabled===t||n.enabled,r=g.isInside,a&&C(e)&&g.y!==null)if(a=g.pointAttr[g.selected?"select":""]||m,h=a.r,i=q(n.symbol,this.symbol),j=i.indexOf("url")===
0,k)k[r?"show":"hide"](!0).attr(a).animate(A({x:d-h,y:e-h},k.symbolName?{width:2*h,height:2*h}:{}));else{if(r&&(h>0||j))g.graphic=c.renderer.symbol(i,d-h,e-h,2*h,2*h,p?n:l).attr(a).add(s)}else if(k)g.graphic=k.destroy()},convertAttribs:function(a,b,c,d){var e=this.pointAttrToOptions,f,g,h={},a=a||{},b=b||{},c=c||{},d=d||{};for(f in e)g=e[f],h[f]=q(a[g],b[f],c[f],d[f]);return h},getAttribs:function(){var a=this,b=a.options,c=W[a.type].marker?b.marker:b,d=c.states,e=d.hover,f,g=a.color,h=a.options.negativeColor,
i={stroke:g,fill:g},j=a.points||[],k,l=[],m,n=a.pointAttrToOptions;f=a.hasPointSpecificOptions;var p=c.lineColor,r=c.fillColor;k=b.turboThreshold;var s=a.zones,F=a.zoneAxis||"y",u,x;b.marker?(e.radius=e.radius||c.radius+e.radiusPlus,e.lineWidth=e.lineWidth||c.lineWidth+e.lineWidthPlus):(e.color=e.color||va(e.color||g).brighten(e.brightness).get(),e.negativeColor=e.negativeColor||va(e.negativeColor||h).brighten(e.brightness).get());l[""]=a.convertAttribs(c,i);o(["hover","select"],function(b){l[b]=
a.convertAttribs(d[b],l[""])});a.pointAttr=l;g=j.length;if(!k||g<k||f)for(;g--;){k=j[g];if((c=k.options&&k.options.marker||k.options)&&c.enabled===!1)c.radius=0;i=null;if(s.length){f=0;for(i=s[f];k[F]>=i.value;)i=s[++f];k.color=k.fillColor=i=q(i.color,a.color)}f=b.colorByPoint||k.color;if(k.options)for(x in n)v(c[n[x]])&&(f=!0);if(f){c=c||{};m=[];d=c.states||{};f=d.hover=d.hover||{};if(!b.marker||k.negative&&!f.fillColor&&!e.fillColor)f[a.pointAttrToOptions.fill]=f.color||!k.options.color&&e[k.negative&&
h?"negativeColor":"color"]||va(k.color).brighten(f.brightness||e.brightness).get();u={color:k.color};if(!r)u.fillColor=k.color;if(!p)u.lineColor=k.color;c.hasOwnProperty("color")&&!c.color&&delete c.color;if(i&&!e.fillColor)f.fillColor=i;m[""]=a.convertAttribs(A(u,c),l[""]);m.hover=a.convertAttribs(d.hover,l.hover,m[""]);m.select=a.convertAttribs(d.select,l.select,m[""])}else m=l;k.pointAttr=m}},destroy:function(){var a=this,b=a.chart,c=/AppleWebKit\/533/.test(Na),d,e=a.data||[],f,g,h;O(a,"destroy");
T(a);o(a.axisTypes||[],function(b){if(h=a[b])za(h.series,a),h.isDirty=h.forceRedraw=!0});a.legendItem&&a.chart.legend.destroyItem(a);for(d=e.length;d--;)(f=e[d])&&f.destroy&&f.destroy();a.points=null;clearTimeout(a.animationTimeout);for(g in a)a[g]instanceof Z&&!a[g].survive&&(d=c&&g==="group"?"hide":"destroy",a[g][d]());if(b.hoverSeries===a)b.hoverSeries=null;za(b.series,a);for(g in a)delete a[g]},getGraphPath:function(a,b,c){var d=this,e=d.options,f=e.step,g,h=[],i,a=a||d.points;(g=a.reversed)&&
a.reverse();(f={right:1,center:2}[f]||f&&3)&&g&&(f=4-f);e.connectNulls&&!b&&!c&&(a=this.getValidPoints(a));o(a,function(g,k){var l=g.plotX,m=g.plotY,n=a[k-1];if((g.leftCliff||n&&n.rightCliff)&&!c)i=!0;g.isNull&&!v(b)&&k>0?i=!e.connectNulls:g.isNull&&!b?i=!0:(k===0||i?n=["M",g.plotX,g.plotY]:d.getPointSpline?n=d.getPointSpline(a,g,k):f?(n=f===1?["L",n.plotX,m]:f===2?["L",(n.plotX+l)/2,n.plotY,"L",(n.plotX+l)/2,m]:["L",l,n.plotY],n.push("L",l,m)):n=["L",l,m],h.push.apply(h,n),i=!1)});return d.graphPath=
h},drawGraph:function(){var a=this,b=this.options,c=[["graph",b.lineColor||this.color,b.dashStyle]],d=b.lineWidth,e=b.linecap!=="square",f=(this.gappedPath||this.getGraphPath).call(this),g=this.fillGraph&&this.color||"none";o(this.zones,function(d,e){c.push(["zoneGraph"+e,d.color||a.color,d.dashStyle||b.dashStyle])});o(c,function(c,i){var j=c[0],k=a[j];if(k)k.animate({d:f});else if((d||g)&&f.length)k={stroke:c[1],"stroke-width":d,fill:g,zIndex:1},c[2]?k.dashstyle=c[2]:e&&(k["stroke-linecap"]=k["stroke-linejoin"]=
"round"),a[j]=a.chart.renderer.path(f).attr(k).add(a.group).shadow(i<2&&b.shadow)})},applyZones:function(){var a=this,b=this.chart,c=b.renderer,d=this.zones,e,f,g=this.clips||[],h,i=this.graph,j=this.area,k=w(b.chartWidth,b.chartHeight),l=this[(this.zoneAxis||"y")+"Axis"],m,n=l.reversed,p=b.inverted,r=l.horiz,s,F,u,x=!1;if(d.length&&(i||j)&&l.min!==t)i&&i.hide(),j&&j.hide(),m=l.getExtremes(),o(d,function(d,o){e=n?r?b.plotWidth:0:r?0:l.toPixels(m.min);e=G(w(q(f,e),0),k);f=G(w(y(l.toPixels(q(d.value,
m.max),!0)),0),k);x&&(e=f=l.toPixels(m.max));s=Math.abs(e-f);F=G(e,f);u=w(e,f);if(l.isXAxis){if(h={x:p?u:F,y:0,width:s,height:k},!r)h.x=b.plotHeight-h.x}else if(h={x:0,y:p?u:F,width:k,height:s},r)h.y=b.plotWidth-h.y;b.inverted&&c.isVML&&(h=l.isXAxis?{x:0,y:n?F:u,height:h.width,width:b.chartWidth}:{x:h.y-b.plotLeft-b.spacingBox.x,y:0,width:h.height,height:b.chartHeight});g[o]?g[o].animate(h):(g[o]=c.clipRect(h),i&&a["zoneGraph"+o].clip(g[o]),j&&a["zoneArea"+o].clip(g[o]));x=d.value>m.max}),this.clips=
g},invertGroups:function(){function a(){var a={width:b.yAxis.len,height:b.xAxis.len};o(["group","markerGroup"],function(c){b[c]&&b[c].attr(a).invert()})}var b=this,c=b.chart;if(b.xAxis)E(c,"resize",a),E(b,"destroy",function(){T(c,"resize",a)}),a(),b.invertGroups=a},plotGroup:function(a,b,c,d,e){var f=this[a],g=!f;g&&(this[a]=f=this.chart.renderer.g(b).attr({zIndex:d||0.1}).add(e),f.addClass("highcharts-series-"+this.index));f.attr({visibility:c})[g?"attr":"animate"](this.getPlotBox());return f},getPlotBox:function(){var a=
this.chart,b=this.xAxis,c=this.yAxis;if(a.inverted)b=c,c=this.xAxis;return{translateX:b?b.left:a.plotLeft,translateY:c?c.top:a.plotTop,scaleX:1,scaleY:1}},render:function(){var a=this,b=a.chart,c,d=a.options,e=!!a.animate&&b.renderer.isSVG&&gb(d.animation).duration,f=a.visible?"inherit":"hidden",g=d.zIndex,h=a.hasRendered,i=b.seriesGroup;c=a.plotGroup("group","series",f,g,i);a.markerGroup=a.plotGroup("markerGroup","markers",f,g,i);e&&a.animate(!0);a.getAttribs();c.inverted=a.isCartesian?b.inverted:
!1;a.drawGraph&&(a.drawGraph(),a.applyZones());o(a.points,function(a){a.redraw&&a.redraw()});a.drawDataLabels&&a.drawDataLabels();a.visible&&a.drawPoints();a.drawTracker&&a.options.enableMouseTracking!==!1&&a.drawTracker();b.inverted&&a.invertGroups();d.clip!==!1&&!a.sharedClipKey&&!h&&c.clip(b.clipRect);e&&a.animate();if(!h)a.animationTimeout=Za(function(){a.afterAnimate()},e);a.isDirty=a.isDirtyData=!1;a.hasRendered=!0},redraw:function(){var a=this.chart,b=this.isDirty||this.isDirtyData,c=this.group,
d=this.xAxis,e=this.yAxis;c&&(a.inverted&&c.attr({width:a.plotWidth,height:a.plotHeight}),c.animate({translateX:q(d&&d.left,a.plotLeft),translateY:q(e&&e.top,a.plotTop)}));this.translate();this.render();b&&delete this.kdTree},kdDimensions:1,kdAxisArray:["clientX","plotY"],searchPoint:function(a,b){var c=this.xAxis,d=this.yAxis,e=this.chart.inverted;return this.searchKDTree({clientX:e?c.len-a.chartY+c.pos:a.chartX-c.pos,plotY:e?d.len-a.chartX+d.pos:a.chartY-d.pos},b)},buildKDTree:function(){function a(c,
e,f){var g,h;if(h=c&&c.length)return g=b.kdAxisArray[e%f],c.sort(function(a,b){return a[g]-b[g]}),h=Math.floor(h/2),{point:c[h],left:a(c.slice(0,h),e+1,f),right:a(c.slice(h+1),e+1,f)}}var b=this,c=b.kdDimensions;delete b.kdTree;Za(function(){b.kdTree=a(b.getValidPoints(null,!b.directTouch),c,c)},b.options.kdNow?0:1)},searchKDTree:function(a,b){function c(a,b,j,k){var l=b.point,m=d.kdAxisArray[j%k],n,p,r=l;p=v(a[e])&&v(l[e])?Math.pow(a[e]-l[e],2):null;n=v(a[f])&&v(l[f])?Math.pow(a[f]-l[f],2):null;
n=(p||0)+(n||0);l.dist=v(n)?Math.sqrt(n):Number.MAX_VALUE;l.distX=v(p)?Math.sqrt(p):Number.MAX_VALUE;m=a[m]-l[m];n=m<0?"left":"right";p=m<0?"right":"left";b[n]&&(n=c(a,b[n],j+1,k),r=n[g]<r[g]?n:l);b[p]&&Math.sqrt(m*m)<r[g]&&(a=c(a,b[p],j+1,k),r=a[g]<r[g]?a:r);return r}var d=this,e=this.kdAxisArray[0],f=this.kdAxisArray[1],g=b?"distX":"dist";this.kdTree||this.buildKDTree();if(this.kdTree)return c(a,this.kdTree,this.kdDimensions,this.kdDimensions)}};Tb.prototype={destroy:function(){Pa(this,this.axis)},
render:function(a){var b=this.options,c=b.format,c=c?La(c,this):b.formatter.call(this);this.label?this.label.attr({text:c,visibility:"hidden"}):this.label=this.axis.chart.renderer.text(c,null,null,b.useHTML).css(b.style).attr({align:this.textAlign,rotation:b.rotation,visibility:"hidden"}).add(a)},setOffset:function(a,b){var c=this.axis,d=c.chart,e=d.inverted,f=c.reversed,f=this.isNegative&&!f||!this.isNegative&&f,g=c.translate(c.usePercentage?100:this.total,0,0,0,1),c=c.translate(0),c=S(g-c),h=d.xAxis[0].translate(this.x)+
a,i=d.plotHeight,f={x:e?f?g:g-c:h,y:e?i-h-b:f?i-g-c:i-g,width:e?c:b,height:e?b:c};if(e=this.label)e.align(this.alignOptions,null,f),f=e.alignAttr,e[this.options.crop===!1||d.isInsidePlot(f.x,f.y)?"show":"hide"](!0)}};Ba.prototype.getStacks=function(){var a=this;o(a.yAxis,function(a){if(a.stacks&&a.hasVisibleSeries)a.oldStacks=a.stacks});o(a.series,function(b){if(b.options.stacking&&(b.visible===!0||a.options.chart.ignoreHiddenSeries===!1))b.stackKey=b.type+q(b.options.stack,"")})};J.prototype.buildStacks=
function(){var a=this.series,b,c=q(this.options.reversedStacks,!0),d=a.length,e;if(!this.isXAxis){this.usePercentage=!1;for(e=d;e--;)a[c?e:d-e-1].setStackedPoints();for(e=d;e--;)b=a[c?e:d-e-1],b.setStackCliffs&&b.setStackCliffs();if(this.usePercentage)for(e=0;e<d;e++)a[e].setPercentStacks()}};J.prototype.renderStackTotals=function(){var a=this.chart,b=a.renderer,c=this.stacks,d,e,f=this.stackTotalGroup;if(!f)this.stackTotalGroup=f=b.g("stack-labels").attr({visibility:"visible",zIndex:6}).add();f.translate(a.plotLeft,
a.plotTop);for(d in c)for(e in a=c[d],a)a[e].render(f)};J.prototype.resetStacks=function(){var a=this.stacks,b,c;if(!this.isXAxis)for(b in a)for(c in a[b])a[b][c].touched<this.stacksTouched?(a[b][c].destroy(),delete a[b][c]):(a[b][c].total=null,a[b][c].cum=0)};J.prototype.cleanStacks=function(){var a,b,c;if(!this.isXAxis){if(this.oldStacks)a=this.stacks=this.oldStacks;for(b in a)for(c in a[b])a[b][c].cum=a[b][c].total}};P.prototype.setStackedPoints=function(){if(this.options.stacking&&!(this.visible!==
!0&&this.chart.options.chart.ignoreHiddenSeries!==!1)){var a=this.processedXData,b=this.processedYData,c=[],d=b.length,e=this.options,f=e.threshold,g=e.startFromThreshold?f:0,h=e.stack,e=e.stacking,i=this.stackKey,j="-"+i,k=this.negStacks,l=this.yAxis,m=l.stacks,n=l.oldStacks,p,r,s,o,u,x,D;l.stacksTouched+=1;for(u=0;u<d;u++){x=a[u];D=b[u];p=this.getStackIndicator(p,x,this.index);o=p.key;s=(r=k&&D<(g?0:f))?j:i;m[s]||(m[s]={});if(!m[s][x])n[s]&&n[s][x]?(m[s][x]=n[s][x],m[s][x].total=null):m[s][x]=new Tb(l,
l.options.stackLabels,r,x,h);s=m[s][x];if(D!==null)s.points[o]=s.points[this.index]=[q(s.cum,g)],s.touched=l.stacksTouched,p.index>0&&this.singleStacks===!1&&(s.points[o][0]=s.points[this.index+","+x+",0"][0]);e==="percent"?(r=r?i:j,k&&m[r]&&m[r][x]?(r=m[r][x],s.total=r.total=w(r.total,s.total)+S(D)||0):s.total=ka(s.total+(S(D)||0))):s.total=ka(s.total+(D||0));s.cum=q(s.cum,g)+(D||0);if(D!==null)s.points[o].push(s.cum),c[u]=s.cum}if(e==="percent")l.usePercentage=!0;this.stackedYData=c;l.oldStacks=
{}}};P.prototype.setPercentStacks=function(){var a=this,b=a.stackKey,c=a.yAxis.stacks,d=a.processedXData,e;o([b,"-"+b],function(b){var f;for(var g=d.length,h,i;g--;)if(h=d[g],e=a.getStackIndicator(e,h,a.index),f=(i=c[b]&&c[b][h])&&i.points[e.key],h=f)i=i.total?100/i.total:0,h[0]=ka(h[0]*i),h[1]=ka(h[1]*i),a.stackedYData[g]=h[1]})};P.prototype.getStackIndicator=function(a,b,c){!v(a)||a.x!==b?a={x:b,index:0}:a.index++;a.key=[c,b,a.index].join(",");return a};A(Ba.prototype,{addSeries:function(a,b,c){var d,
e=this;a&&(b=q(b,!0),O(e,"addSeries",{options:a},function(){d=e.initSeries(a);e.isDirtyLegend=!0;e.linkSeries();b&&e.redraw(c)}));return d},addAxis:function(a,b,c,d){var e=b?"xAxis":"yAxis",f=this.options,a=z(a,{index:this[e].length,isX:b});new J(this,a);f[e]=ua(f[e]||{});f[e].push(a);q(c,!0)&&this.redraw(d)},showLoading:function(a){var b=this,c=b.options,d=b.loadingDiv,e=c.loading,f=function(){d&&N(d,{left:b.plotLeft+"px",top:b.plotTop+"px",width:b.plotWidth+"px",height:b.plotHeight+"px"})};if(!d)b.loadingDiv=
d=fa(Va,{className:"highcharts-loading"},A(e.style,{zIndex:10,display:"none"}),b.container),b.loadingSpan=fa("span",null,e.labelStyle,d),E(b,"redraw",f);b.loadingSpan.innerHTML=a||c.lang.loading;if(!b.loadingShown)N(d,{opacity:0,display:""}),db(d,{opacity:e.style.opacity},{duration:e.showDuration||0}),b.loadingShown=!0;f()},hideLoading:function(){var a=this.options,b=this.loadingDiv;b&&db(b,{opacity:0},{duration:a.loading.hideDuration||100,complete:function(){N(b,{display:"none"})}});this.loadingShown=
!1}});A(Ha.prototype,{update:function(a,b,c,d){function e(){f.applyOptions(a);if(f.y===null&&h)f.graphic=h.destroy();if(ea(a)&&!Ja(a))f.redraw=function(){if(h&&h.element&&a&&a.marker&&a.marker.symbol)f.graphic=h.destroy();if(a&&a.dataLabels&&f.dataLabel)f.dataLabel=f.dataLabel.destroy();f.redraw=null};i=f.index;g.updateParallelArrays(f,i);if(l&&f.name)l[f.x]=f.name;k.data[i]=ea(k.data[i])&&!Ja(k.data[i])?f.options:a;g.isDirty=g.isDirtyData=!0;if(!g.fixedBox&&g.hasCartesianSeries)j.isDirtyBox=!0;if(k.legendType===
"point")j.isDirtyLegend=!0;b&&j.redraw(c)}var f=this,g=f.series,h=f.graphic,i,j=g.chart,k=g.options,l=g.xAxis&&g.xAxis.names,b=q(b,!0);d===!1?e():f.firePointEvent("update",{options:a},e)},remove:function(a,b){this.series.removePoint(sa(this,this.series.data),a,b)}});A(P.prototype,{addPoint:function(a,b,c,d){var e=this,f=e.options,g=e.data,h=e.graph,i=e.area,j=e.chart,k=e.xAxis&&e.xAxis.names,l=h&&h.shift||0,m=["graph","area"],h=f.data,n,p=e.xData;$a(d,j);if(c){for(d=e.zones.length;d--;)m.push("zoneGraph"+
d,"zoneArea"+d);o(m,function(a){if(e[a])e[a].shift=l+(f.step?2:1)})}if(i)i.isArea=!0;b=q(b,!0);i={series:e};e.pointClass.prototype.applyOptions.apply(i,[a]);m=i.x;d=p.length;if(e.requireSorting&&m<p[d-1])for(n=!0;d&&p[d-1]>m;)d--;e.updateParallelArrays(i,"splice",d,0,0);e.updateParallelArrays(i,d);if(k&&i.name)k[m]=i.name;h.splice(d,0,a);n&&(e.data.splice(d,0,null),e.processData());f.legendType==="point"&&e.generatePoints();c&&(g[0]&&g[0].remove?g[0].remove(!1):(g.shift(),e.updateParallelArrays(i,
"shift"),h.shift()));e.isDirty=!0;e.isDirtyData=!0;b&&(e.getAttribs(),j.redraw())},removePoint:function(a,b,c){var d=this,e=d.data,f=e[a],g=d.points,h=d.chart,i=function(){g&&g.length===e.length&&g.splice(a,1);e.splice(a,1);d.options.data.splice(a,1);d.updateParallelArrays(f||{series:d},"splice",a,1);f&&f.destroy();d.isDirty=!0;d.isDirtyData=!0;b&&h.redraw()};$a(c,h);b=q(b,!0);f?f.firePointEvent("remove",null,i):i()},remove:function(a,b){var c=this,d=c.chart;O(c,"remove",null,function(){c.destroy();
d.isDirtyLegend=d.isDirtyBox=!0;d.linkSeries();q(a,!0)&&d.redraw(b)})},update:function(a,b){var c=this,d=this.chart,e=this.userOptions,f=this.type,g=I[f].prototype,h=["group","markerGroup","dataLabelsGroup"],i;if(a.type&&a.type!==f||a.zIndex!==void 0)h.length=0;o(h,function(a){h[a]=c[a];delete c[a]});a=z(e,{animation:!1,index:this.index,pointStart:this.xData[0]},{data:this.options.data},a);this.remove(!1);for(i in g)this[i]=t;A(this,I[a.type||f].prototype);o(h,function(a){c[a]=h[a]});this.init(d,
a);d.linkSeries();q(b,!0)&&d.redraw(!1)}});A(J.prototype,{update:function(a,b){var c=this.chart,a=c.options[this.coll][this.options.index]=z(this.userOptions,a);this.destroy(!0);this._addedPlotLB=this.chart._labelPanes=t;this.init(c,A(a,{events:t}));c.isDirtyBox=!0;q(b,!0)&&c.redraw()},remove:function(a){for(var b=this.chart,c=this.coll,d=this.series,e=d.length;e--;)d[e]&&d[e].remove(!1);za(b.axes,this);za(b[c],this);b.options[c].splice(this.options.index,1);o(b[c],function(a,b){a.options.index=b});
this.destroy();b.isDirtyBox=!0;q(a,!0)&&b.redraw()},setTitle:function(a,b){this.update({title:a},b)},setCategories:function(a,b){this.update({categories:a},b)}});var Ia=ma(P);I.line=Ia;W.area=z(da,{softThreshold:!1,threshold:0});var ya=ma(P,{type:"area",singleStacks:!1,getStackPoints:function(){var a=[],b=[],c=this.xAxis,d=this.yAxis,e=d.stacks[this.stackKey],f={},g=this.points,h=this.index,i=d.series,j=i.length,k,l=q(d.options.reversedStacks,!0)?1:-1,m,n;if(this.options.stacking){for(m=0;m<g.length;m++)f[g[m].x]=
g[m];for(n in e)e[n].total!==null&&b.push(n);b.sort(function(a,b){return a-b});k=ta(i,function(){return this.visible});o(b,function(g,i){var n=0,q,u;if(f[g]&&!f[g].isNull)a.push(f[g]),o([-1,1],function(a){var c=a===1?"rightNull":"leftNull",d=0,n=e[b[i+a]];if(n)for(m=h;m>=0&&m<j;)q=n.points[m],q||(m===h?f[g][c]=!0:k[m]&&(u=e[g].points[m])&&(d-=u[1]-u[0])),m+=l;f[g][a===1?"rightCliff":"leftCliff"]=d});else{for(m=h;m>=0&&m<j;){if(q=e[g].points[m]){n=q[1];break}m+=l}n=d.toPixels(n,!0);a.push({isNull:!0,
plotX:c.toPixels(g,!0),plotY:n,yBottom:n})}})}return a},getGraphPath:function(a){var b=P.prototype.getGraphPath,c=this.options,d=c.stacking,e=this.yAxis,f,g,h=[],i=[],j=this.index,k,l=e.stacks[this.stackKey],m=c.threshold,n=e.getThreshold(c.threshold),p,c=c.connectNulls||d==="percent",r=function(b,c,f){var g=a[b],b=d&&l[g.x].points[j],p=g[f+"Null"]||0,f=g[f+"Cliff"]||0,r,o,g=!0;f||p?(r=(p?b[0]:b[1])+f,o=b[0]+f,g=!!p):!d&&a[c]&&a[c].isNull&&(r=o=m);r!==void 0&&(i.push({plotX:k,plotY:r===null?n:e.getThreshold(r),
isNull:g}),h.push({plotX:k,plotY:o===null?n:e.getThreshold(o)}))},a=a||this.points;d&&(a=this.getStackPoints());for(f=0;f<a.length;f++)if(g=a[f].isNull,k=q(a[f].rectPlotX,a[f].plotX),p=q(a[f].yBottom,n),!g||c){c||r(f,f-1,"left");if(!g||d||!c)i.push(a[f]),h.push({x:f,plotX:k,plotY:p});c||r(f,f+1,"right")}f=b.call(this,i,!0,!0);h.reversed=!0;g=b.call(this,h,!0,!0);g.length&&(g[0]="L");f=f.concat(g);b=b.call(this,i,!1,c);this.areaPath=f;return b},drawGraph:function(){this.areaPath=[];P.prototype.drawGraph.apply(this);
var a=this,b=this.areaPath,c=this.options,d=[["area",this.color,c.fillColor]];o(this.zones,function(b,f){d.push(["zoneArea"+f,b.color||a.color,b.fillColor||c.fillColor])});o(d,function(d){var f=d[0],g=a[f];g?g.animate({d:b}):(g={fill:d[2]||d[1],zIndex:0},d[2]||(g["fill-opacity"]=q(c.fillOpacity,0.75)),a[f]=a.chart.renderer.path(b).attr(g).add(a.group))})},drawLegendSymbol:aa.drawRectangle});I.area=ya;W.spline=z(da);Ia=ma(P,{type:"spline",getPointSpline:function(a,b,c){var d=b.plotX,e=b.plotY,f=a[c-
1],c=a[c+1],g,h,i,j;if(f&&!f.isNull&&c&&!c.isNull){a=f.plotY;i=c.plotX;var c=c.plotY,k=0;g=(1.5*d+f.plotX)/2.5;h=(1.5*e+a)/2.5;i=(1.5*d+i)/2.5;j=(1.5*e+c)/2.5;i!==g&&(k=(j-h)*(i-d)/(i-g)+e-j);h+=k;j+=k;h>a&&h>e?(h=w(a,e),j=2*e-h):h<a&&h<e&&(h=G(a,e),j=2*e-h);j>c&&j>e?(j=w(c,e),h=2*e-j):j<c&&j<e&&(j=G(c,e),h=2*e-j);b.rightContX=i;b.rightContY=j}b=["C",q(f.rightContX,f.plotX),q(f.rightContY,f.plotY),q(g,d),q(h,e),d,e];f.rightContX=f.rightContY=null;return b}});I.spline=Ia;W.areaspline=z(W.area);ya=
ya.prototype;Ia=ma(Ia,{type:"areaspline",getStackPoints:ya.getStackPoints,getGraphPath:ya.getGraphPath,setStackCliffs:ya.setStackCliffs,drawGraph:ya.drawGraph,drawLegendSymbol:aa.drawRectangle});I.areaspline=Ia;W.column=z(da,{borderColor:"#FFFFFF",borderRadius:0,groupPadding:0.2,marker:null,pointPadding:0.1,minPointLength:0,cropThreshold:50,pointRange:null,states:{hover:{brightness:0.1,shadow:!1,halo:!1},select:{color:"#C0C0C0",borderColor:"#000000",shadow:!1}},dataLabels:{align:null,verticalAlign:null,
y:null},softThreshold:!1,startFromThreshold:!0,stickyTracking:!1,tooltip:{distance:6},threshold:0});Ia=ma(P,{type:"column",pointAttrToOptions:{stroke:"borderColor",fill:"color",r:"borderRadius"},cropShoulder:0,directTouch:!0,trackerGroups:["group","dataLabelsGroup"],negStacks:!0,init:function(){P.prototype.init.apply(this,arguments);var a=this,b=a.chart;b.hasRendered&&o(b.series,function(b){if(b.type===a.type)b.isDirty=!0})},getColumnMetrics:function(){var a=this,b=a.options,c=a.xAxis,d=a.yAxis,e=
c.reversed,f,g={},h=0;b.grouping===!1?h=1:o(a.chart.series,function(b){var c=b.options,e=b.yAxis,i;if(b.type===a.type&&b.visible&&d.len===e.len&&d.pos===e.pos)c.stacking?(f=b.stackKey,g[f]===t&&(g[f]=h++),i=g[f]):c.grouping!==!1&&(i=h++),b.columnIndex=i});var i=G(S(c.transA)*(c.ordinalSlope||b.pointRange||c.closestPointRange||c.tickInterval||1),c.len),j=i*b.groupPadding,k=(i-2*j)/h,b=G(b.maxPointWidth||c.len,q(b.pointWidth,k*(1-2*b.pointPadding)));a.columnMetrics={width:b,offset:(k-b)/2+(j+((a.columnIndex||
0)+(e?1:0))*k-i/2)*(e?-1:1)};return a.columnMetrics},crispCol:function(a,b,c,d){var e=this.chart,f=this.borderWidth,g=-(f%2?0.5:0),f=f%2?0.5:1;e.inverted&&e.renderer.isVML&&(f+=1);c=Math.round(a+c)+g;a=Math.round(a)+g;c-=a;d=Math.round(b+d)+f;g=S(b)<=0.5&&d>0.5;b=Math.round(b)+f;d-=b;g&&d&&(b-=1,d+=1);return{x:a,y:b,width:c,height:d}},translate:function(){var a=this,b=a.chart,c=a.options,d=a.borderWidth=q(c.borderWidth,a.closestPointRange*a.xAxis.transA<2?0:1),e=a.yAxis,f=a.translatedThreshold=e.getThreshold(c.threshold),
g=q(c.minPointLength,5),h=a.getColumnMetrics(),i=h.width,j=a.barW=w(i,1+2*d),k=a.pointXOffset=h.offset;b.inverted&&(f-=0.5);c.pointPadding&&(j=Ea(j));P.prototype.translate.apply(a);o(a.points,function(c){var d=G(q(c.yBottom,f),9E4),h=999+S(d),h=G(w(-h,c.plotY),e.len+h),p=c.plotX+k,r=j,o=G(h,d),F,u=w(h,d)-o;S(u)<g&&g&&(u=g,F=!e.reversed&&!c.negative||e.reversed&&c.negative,o=S(o-f)>g?d-g:f-(F?g:0));c.barX=p;c.pointWidth=i;c.tooltipPos=b.inverted?[e.len+e.pos-b.plotLeft-h,a.xAxis.len-p-r/2,u]:[p+r/
2,h+e.pos-b.plotTop,u];c.shapeType="rect";c.shapeArgs=a.crispCol(p,o,r,u)})},getSymbol:ra,drawLegendSymbol:aa.drawRectangle,drawGraph:ra,drawPoints:function(){var a=this,b=this.chart,c=a.options,d=b.renderer,e=c.animationLimit||250,f,g;o(a.points,function(h){var i=h.graphic,j;if(C(h.plotY)&&h.y!==null)f=h.shapeArgs,j=v(a.borderWidth)?{"stroke-width":a.borderWidth}:{},g=h.pointAttr[h.selected?"select":""]||a.pointAttr[""],i?(Sa(i),i.attr(j).attr(g)[b.pointCount<e?"animate":"attr"](z(f))):h.graphic=
d[h.shapeType](f).attr(j).attr(g).add(h.group||a.group).shadow(c.shadow,null,c.stacking&&!c.borderRadius);else if(i)h.graphic=i.destroy()})},animate:function(a){var b=this,c=this.yAxis,d=b.options,e=this.chart.inverted,f={};if(ja)a?(f.scaleY=0.001,a=G(c.pos+c.len,w(c.pos,c.toPixels(d.threshold))),e?f.translateX=a-c.len:f.translateY=a,b.group.attr(f)):(f[e?"translateX":"translateY"]=c.pos,b.group.animate(f,A(gb(b.options.animation),{step:function(a,c){b.group.attr({scaleY:w(0.001,c.pos)})}})),b.animate=
null)},remove:function(){var a=this,b=a.chart;b.hasRendered&&o(b.series,function(b){if(b.type===a.type)b.isDirty=!0});P.prototype.remove.apply(a,arguments)}});I.column=Ia;W.bar=z(W.column);ya=ma(Ia,{type:"bar",inverted:!0});I.bar=ya;W.scatter=z(da,{lineWidth:0,marker:{enabled:!0},tooltip:{headerFormat:'<span style="color:{point.color}">\u25cf</span> <span style="font-size: 10px;"> {series.name}</span><br/>',pointFormat:"x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>"}});ya=ma(P,{type:"scatter",
sorted:!1,requireSorting:!1,noSharedTooltip:!0,trackerGroups:["group","markerGroup","dataLabelsGroup"],takeOrdinalPosition:!1,kdDimensions:2,drawGraph:function(){this.options.lineWidth&&P.prototype.drawGraph.call(this)}});I.scatter=ya;W.pie=z(da,{borderColor:"#FFFFFF",borderWidth:1,center:[null,null],clip:!1,colorByPoint:!0,dataLabels:{distance:30,enabled:!0,formatter:function(){return this.y===null?void 0:this.point.name},x:0},ignoreHiddenPoint:!0,legendType:"point",marker:null,size:null,showInLegend:!1,
slicedOffset:10,states:{hover:{brightness:0.1,shadow:!1}},stickyTracking:!1,tooltip:{followPointer:!0}});da={type:"pie",isCartesian:!1,pointClass:ma(Ha,{init:function(){Ha.prototype.init.apply(this,arguments);var a=this,b;a.name=q(a.name,"Slice");b=function(b){a.slice(b.type==="select")};E(a,"select",b);E(a,"unselect",b);return a},setVisible:function(a,b){var c=this,d=c.series,e=d.chart,f=d.options.ignoreHiddenPoint,b=q(b,f);if(a!==c.visible){c.visible=c.options.visible=a=a===t?!c.visible:a;d.options.data[sa(c,
d.data)]=c.options;o(["graphic","dataLabel","connector","shadowGroup"],function(b){if(c[b])c[b][a?"show":"hide"](!0)});c.legendItem&&e.legend.colorizeItem(c,a);!a&&c.state==="hover"&&c.setState("");if(f)d.isDirty=!0;b&&e.redraw()}},slice:function(a,b,c){var d=this.series;$a(c,d.chart);q(b,!0);this.sliced=this.options.sliced=a=v(a)?a:!this.sliced;d.options.data[sa(this,d.data)]=this.options;a=a?this.slicedTranslation:{translateX:0,translateY:0};this.graphic.animate(a);this.shadowGroup&&this.shadowGroup.animate(a)},
haloPath:function(a){var b=this.shapeArgs,c=this.series.chart;return this.sliced||!this.visible?[]:this.series.chart.renderer.symbols.arc(c.plotLeft+b.x,c.plotTop+b.y,b.r+a,b.r+a,{innerR:this.shapeArgs.r,start:b.start,end:b.end})}}),requireSorting:!1,directTouch:!0,noSharedTooltip:!0,trackerGroups:["group","dataLabelsGroup"],axisTypes:[],pointAttrToOptions:{stroke:"borderColor","stroke-width":"borderWidth",fill:"color"},animate:function(a){var b=this,c=b.points,d=b.startAngleRad;if(!a)o(c,function(a){var c=
a.graphic,g=a.shapeArgs;c&&(c.attr({r:a.startR||b.center[3]/2,start:d,end:d}),c.animate({r:g.r,start:g.start,end:g.end},b.options.animation))}),b.animate=null},updateTotals:function(){var a,b=0,c=this.points,d=c.length,e,f=this.options.ignoreHiddenPoint;for(a=0;a<d;a++)e=c[a],b+=f&&!e.visible?0:e.y;this.total=b;for(a=0;a<d;a++)e=c[a],e.percentage=b>0&&(e.visible||!f)?e.y/b*100:0,e.total=b},generatePoints:function(){P.prototype.generatePoints.call(this);this.updateTotals()},translate:function(a){this.generatePoints();
var b=0,c=this.options,d=c.slicedOffset,e=d+c.borderWidth,f,g,h,i=c.startAngle||0,j=this.startAngleRad=Aa/180*(i-90),i=(this.endAngleRad=Aa/180*(q(c.endAngle,i+360)-90))-j,k=this.points,l=c.dataLabels.distance,c=c.ignoreHiddenPoint,m,n=k.length,p;if(!a)this.center=a=this.getCenter();this.getX=function(b,c){h=Y.asin(G((b-a[1])/(a[2]/2+l),1));return a[0]+(c?-1:1)*ca(h)*(a[2]/2+l)};for(m=0;m<n;m++){p=k[m];f=j+b*i;if(!c||p.visible)b+=p.percentage/100;g=j+b*i;p.shapeType="arc";p.shapeArgs={x:a[0],y:a[1],
r:a[2]/2,innerR:a[3]/2,start:y(f*1E3)/1E3,end:y(g*1E3)/1E3};h=(g+f)/2;h>1.5*Aa?h-=2*Aa:h<-Aa/2&&(h+=2*Aa);p.slicedTranslation={translateX:y(ca(h)*d),translateY:y(la(h)*d)};f=ca(h)*a[2]/2;g=la(h)*a[2]/2;p.tooltipPos=[a[0]+f*0.7,a[1]+g*0.7];p.half=h<-Aa/2||h>Aa/2?1:0;p.angle=h;e=G(e,l/2);p.labelPos=[a[0]+f+ca(h)*l,a[1]+g+la(h)*l,a[0]+f+ca(h)*e,a[1]+g+la(h)*e,a[0]+f,a[1]+g,l<0?"center":p.half?"right":"left",h]}},drawGraph:null,drawPoints:function(){var a=this,b=a.chart.renderer,c,d,e=a.options.shadow,
f,g,h,i;if(e&&!a.shadowGroup)a.shadowGroup=b.g("shadow").add(a.group);o(a.points,function(j){if(j.y!==null){d=j.graphic;h=j.shapeArgs;f=j.shadowGroup;g=j.pointAttr[j.selected?"select":""];if(!g.stroke)g.stroke=g.fill;if(e&&!f)f=j.shadowGroup=b.g("shadow").add(a.shadowGroup);c=j.sliced?j.slicedTranslation:{translateX:0,translateY:0};f&&f.attr(c);if(d)d.setRadialReference(a.center).attr(g).animate(A(h,c));else{i={"stroke-linejoin":"round"};if(!j.visible)i.visibility="hidden";j.graphic=d=b[j.shapeType](h).setRadialReference(a.center).attr(g).attr(i).attr(c).add(a.group).shadow(e,
f)}}})},searchPoint:ra,sortByAngle:function(a,b){a.sort(function(a,d){return a.angle!==void 0&&(d.angle-a.angle)*b})},drawLegendSymbol:aa.drawRectangle,getCenter:bc.getCenter,getSymbol:ra};da=ma(P,da);I.pie=da;P.prototype.drawDataLabels=function(){var a=this,b=a.options,c=b.cursor,d=b.dataLabels,e=a.points,f,g,h=a.hasRendered||0,i,j,k=q(d.defer,!0),l=a.chart.renderer;if(d.enabled||a._hasPointLabels)a.dlProcessOptions&&a.dlProcessOptions(d),j=a.plotGroup("dataLabelsGroup","data-labels",k&&!h?"hidden":
"visible",d.zIndex||6),k&&(j.attr({opacity:+h}),h||E(a,"afterAnimate",function(){a.visible&&j.show();j[b.animation?"animate":"attr"]({opacity:1},{duration:200})})),g=d,o(e,function(e){var h,k=e.dataLabel,r,o,F=e.connector,u=!0,x,D={};f=e.dlOptions||e.options&&e.options.dataLabels;h=q(f&&f.enabled,g.enabled)&&e.y!==null;if(k&&!h)e.dataLabel=k.destroy();else if(h){d=z(g,f);x=d.style;h=d.rotation;r=e.getLabelConfig();i=d.format?La(d.format,r):d.formatter.call(r,d);x.color=q(d.color,x.color,a.color,"black");
if(k)if(v(i))k.attr({text:i}),u=!1;else{if(e.dataLabel=k=k.destroy(),F)e.connector=F.destroy()}else if(v(i)){k={fill:d.backgroundColor,stroke:d.borderColor,"stroke-width":d.borderWidth,r:d.borderRadius||0,rotation:h,padding:d.padding,zIndex:1};if(x.color==="contrast")D.color=d.inside||d.distance<0||b.stacking?l.getContrast(e.color||a.color):"#000000";if(c)D.cursor=c;for(o in k)k[o]===t&&delete k[o];k=e.dataLabel=l[h?"text":"label"](i,0,-9999,d.shape,null,null,d.useHTML).attr(k).css(A(x,D)).add(j).shadow(d.shadow)}k&&
a.alignDataLabel(e,k,d,null,u)}})};P.prototype.alignDataLabel=function(a,b,c,d,e){var f=this.chart,g=f.inverted,h=q(a.plotX,-9999),i=q(a.plotY,-9999),j=b.getBBox(),k=f.renderer.fontMetrics(c.style.fontSize).b,l=c.rotation,m=c.align,n=this.visible&&(a.series.forceDL||f.isInsidePlot(h,y(i),g)||d&&f.isInsidePlot(h,g?d.x+1:d.y+d.height-1,g)),p=q(c.overflow,"justify")==="justify";if(n)d=A({x:g?f.plotWidth-i:h,y:y(g?f.plotHeight-h:i),width:0,height:0},d),A(c,{width:j.width,height:j.height}),l?(p=!1,g=f.renderer.rotCorr(k,
l),g={x:d.x+c.x+d.width/2+g.x,y:d.y+c.y+{top:0,middle:0.5,bottom:1}[c.verticalAlign]*d.height},b[e?"attr":"animate"](g).attr({align:m}),h=(l+720)%360,h=h>180&&h<360,m==="left"?g.y-=h?j.height:0:m==="center"?(g.x-=j.width/2,g.y-=j.height/2):m==="right"&&(g.x-=j.width,g.y-=h?0:j.height)):(b.align(c,null,d),g=b.alignAttr),p?this.justifyDataLabel(b,c,g,j,d,e):q(c.crop,!0)&&(n=f.isInsidePlot(g.x,g.y)&&f.isInsidePlot(g.x+j.width,g.y+j.height)),c.shape&&!l&&b.attr({anchorX:a.plotX,anchorY:a.plotY});if(!n)Sa(b),
b.attr({y:-9999}),b.placed=!1};P.prototype.justifyDataLabel=function(a,b,c,d,e,f){var g=this.chart,h=b.align,i=b.verticalAlign,j,k,l=a.box?0:a.padding||0;j=c.x+l;if(j<0)h==="right"?b.align="left":b.x=-j,k=!0;j=c.x+d.width-l;if(j>g.plotWidth)h==="left"?b.align="right":b.x=g.plotWidth-j,k=!0;j=c.y+l;if(j<0)i==="bottom"?b.verticalAlign="top":b.y=-j,k=!0;j=c.y+d.height-l;if(j>g.plotHeight)i==="top"?b.verticalAlign="bottom":b.y=g.plotHeight-j,k=!0;if(k)a.placed=!f,a.align(b,null,e)};if(I.pie)I.pie.prototype.drawDataLabels=
function(){var a=this,b=a.data,c,d=a.chart,e=a.options.dataLabels,f=q(e.connectorPadding,10),g=q(e.connectorWidth,1),h=d.plotWidth,i=d.plotHeight,j,k,l=q(e.softConnector,!0),m=e.distance,n=a.center,p=n[2]/2,r=n[1],s=m>0,F,u,x,D=[[],[]],v,t,A,B,z,C=[0,0,0,0],H=function(a,b){return b.y-a.y};if(a.visible&&(e.enabled||a._hasPointLabels)){P.prototype.drawDataLabels.apply(a);o(b,function(a){if(a.dataLabel&&a.visible)D[a.half].push(a),a.dataLabel._pos=null});for(B=2;B--;){var E=[],L=[],K=D[B],I=K.length,
J;if(I){a.sortByAngle(K,B-0.5);for(z=b=0;!b&&K[z];)b=K[z]&&K[z].dataLabel&&(K[z].dataLabel.getBBox().height||21),z++;if(m>0){u=G(r+p+m,d.plotHeight);for(z=w(0,r-p-m);z<=u;z+=b)E.push(z);u=E.length;if(I>u){c=[].concat(K);c.sort(H);for(z=I;z--;)c[z].rank=z;for(z=I;z--;)K[z].rank>=u&&K.splice(z,1);I=K.length}for(z=0;z<I;z++){c=K[z];x=c.labelPos;c=9999;var N,M;for(M=0;M<u;M++)N=S(E[M]-x[1]),N<c&&(c=N,J=M);if(J<z&&E[z]!==null)J=z;else for(u<I-z+J&&E[z]!==null&&(J=u-I+z);E[J]===null;)J++;L.push({i:J,y:E[J]});
E[J]=null}L.sort(H)}for(z=0;z<I;z++){c=K[z];x=c.labelPos;F=c.dataLabel;A=c.visible===!1?"hidden":"inherit";c=x[1];if(m>0){if(u=L.pop(),J=u.i,t=u.y,c>t&&E[J+1]!==null||c<t&&E[J-1]!==null)t=G(w(0,c),d.plotHeight)}else t=c;v=e.justify?n[0]+(B?-1:1)*(p+m):a.getX(t===r-p-m||t===r+p+m?c:t,B);F._attr={visibility:A,align:x[6]};F._pos={x:v+e.x+({left:f,right:-f}[x[6]]||0),y:t+e.y-10};F.connX=v;F.connY=t;if(this.options.size===null)u=F.width,v-u<f?C[3]=w(y(u-v+f),C[3]):v+u>h-f&&(C[1]=w(y(v+u-h+f),C[1])),t-
b/2<0?C[0]=w(y(-t+b/2),C[0]):t+b/2>i&&(C[2]=w(y(t+b/2-i),C[2]))}}}if(Da(C)===0||this.verifyDataLabelOverflow(C))this.placeDataLabels(),s&&g&&o(this.points,function(b){j=b.connector;x=b.labelPos;if((F=b.dataLabel)&&F._pos&&b.visible)A=F._attr.visibility,v=F.connX,t=F.connY,k=l?["M",v+(x[6]==="left"?5:-5),t,"C",v,t,2*x[2]-x[4],2*x[3]-x[5],x[2],x[3],"L",x[4],x[5]]:["M",v+(x[6]==="left"?5:-5),t,"L",x[2],x[3],"L",x[4],x[5]],j?(j.animate({d:k}),j.attr("visibility",A)):b.connector=j=a.chart.renderer.path(k).attr({"stroke-width":g,
stroke:e.connectorColor||b.color||"#606060",visibility:A}).add(a.dataLabelsGroup);else if(j)b.connector=j.destroy()})}},I.pie.prototype.placeDataLabels=function(){o(this.points,function(a){var b=a.dataLabel;if(b&&a.visible)(a=b._pos)?(b.attr(b._attr),b[b.moved?"animate":"attr"](a),b.moved=!0):b&&b.attr({y:-9999})})},I.pie.prototype.alignDataLabel=ra,I.pie.prototype.verifyDataLabelOverflow=function(a){var b=this.center,c=this.options,d=c.center,e=c.minSize||80,f=e,g;d[0]!==null?f=w(b[2]-w(a[1],a[3]),
e):(f=w(b[2]-a[1]-a[3],e),b[0]+=(a[3]-a[1])/2);d[1]!==null?f=w(G(f,b[2]-w(a[0],a[2])),e):(f=w(G(f,b[2]-a[0]-a[2]),e),b[1]+=(a[0]-a[2])/2);f<b[2]?(b[2]=f,b[3]=Math.min(/%$/.test(c.innerSize||0)?f*parseFloat(c.innerSize||0)/100:parseFloat(c.innerSize||0),f),this.translate(b),this.drawDataLabels&&this.drawDataLabels()):g=!0;return g};if(I.column)I.column.prototype.alignDataLabel=function(a,b,c,d,e){var f=this.chart.inverted,g=a.series,h=a.dlBox||a.shapeArgs,i=q(a.below,a.plotY>q(this.translatedThreshold,
g.yAxis.len)),j=q(c.inside,!!this.options.stacking);if(h){d=z(h);if(d.y<0)d.height+=d.y,d.y=0;h=d.y+d.height-g.yAxis.len;h>0&&(d.height-=h);f&&(d={x:g.yAxis.len-d.y-d.height,y:g.xAxis.len-d.x-d.width,width:d.height,height:d.width});if(!j)f?(d.x+=i?0:d.width,d.width=0):(d.y+=i?d.height:0,d.height=0)}c.align=q(c.align,!f||j?"center":i?"right":"left");c.verticalAlign=q(c.verticalAlign,f||j?"middle":i?"top":"bottom");P.prototype.alignDataLabel.call(this,a,b,c,d,e)};(function(a){var b=a.Chart,c=a.each,
d=a.pick,e=a.addEvent;b.prototype.callbacks.push(function(a){function b(){var e=[];c(a.series,function(a){var b=a.options.dataLabels,f=a.dataLabelCollections||["dataLabel"];(b.enabled||a._hasPointLabels)&&!b.allowOverlap&&a.visible&&c(f,function(b){c(a.points,function(a){if(a[b])a[b].labelrank=d(a.labelrank,a.shapeArgs&&a.shapeArgs.height),e.push(a[b])})})});a.hideOverlappingLabels(e)}b();e(a,"redraw",b)});b.prototype.hideOverlappingLabels=function(a){var b=a.length,d,e,j,k,l,m,n,p,r;for(e=0;e<b;e++)if(d=
a[e])d.oldOpacity=d.opacity,d.newOpacity=1;a.sort(function(a,b){return(b.labelrank||0)-(a.labelrank||0)});for(e=0;e<b;e++){j=a[e];for(d=e+1;d<b;++d)if(k=a[d],j&&k&&j.placed&&k.placed&&j.newOpacity!==0&&k.newOpacity!==0&&(l=j.alignAttr,m=k.alignAttr,n=j.parentGroup,p=k.parentGroup,r=2*(j.box?0:j.padding),l=!(m.x+p.translateX>l.x+n.translateX+(j.width-r)||m.x+p.translateX+(k.width-r)<l.x+n.translateX||m.y+p.translateY>l.y+n.translateY+(j.height-r)||m.y+p.translateY+(k.height-r)<l.y+n.translateY)))(j.labelrank<
k.labelrank?j:k).newOpacity=0}c(a,function(a){var b,c;if(a){c=a.newOpacity;if(a.oldOpacity!==c&&a.placed)c?a.show(!0):b=function(){a.hide()},a.alignAttr.opacity=c,a[a.isOld?"animate":"attr"](a.alignAttr,null,b);a.isOld=!0}})}})(B);var mb=B.TrackerMixin={drawTrackerPoint:function(){var a=this,b=a.chart,c=b.pointer,d=a.options.cursor,e=d&&{cursor:d},f=function(a){for(var c=a.target,d;c&&!d;)d=c.point,c=c.parentNode;if(d!==t&&d!==b.hoverPoint)d.onMouseOver(a)};o(a.points,function(a){if(a.graphic)a.graphic.element.point=
a;if(a.dataLabel)a.dataLabel.element.point=a});if(!a._hasTracking)o(a.trackerGroups,function(b){if(a[b]&&(a[b].addClass("highcharts-tracker").on("mouseover",f).on("mouseout",function(a){c.onTrackerMouseOut(a)}).css(e),cb))a[b].on("touchstart",f)}),a._hasTracking=!0},drawTrackerGraph:function(){var a=this,b=a.options,c=b.trackByArea,d=[].concat(c?a.areaPath:a.graphPath),e=d.length,f=a.chart,g=f.pointer,h=f.renderer,i=f.options.tooltip.snap,j=a.tracker,k=b.cursor,l=k&&{cursor:k},m=function(){if(f.hoverSeries!==
a)a.onMouseOver()},n="rgba(192,192,192,"+(ja?1.0E-4:0.002)+")";if(e&&!c)for(k=e+1;k--;)d[k]==="M"&&d.splice(k+1,0,d[k+1]-i,d[k+2],"L"),(k&&d[k]==="M"||k===e)&&d.splice(k,0,"L",d[k-2]+i,d[k-1]);j?j.attr({d:d}):(a.tracker=h.path(d).attr({"stroke-linejoin":"round",visibility:a.visible?"visible":"hidden",stroke:n,fill:c?n:"none","stroke-width":b.lineWidth+(c?0:2*i),zIndex:2}).add(a.group),o([a.tracker,a.markerGroup],function(a){a.addClass("highcharts-tracker").on("mouseover",m).on("mouseout",function(a){g.onTrackerMouseOut(a)}).css(l);
if(cb)a.on("touchstart",m)}))}};if(I.column)Ia.prototype.drawTracker=mb.drawTrackerPoint;if(I.pie)I.pie.prototype.drawTracker=mb.drawTrackerPoint;if(I.scatter)ya.prototype.drawTracker=mb.drawTrackerPoint;A(ub.prototype,{setItemEvents:function(a,b,c,d,e){var f=this;(c?b:a.legendGroup).on("mouseover",function(){a.setState("hover");b.css(f.options.itemHoverStyle)}).on("mouseout",function(){b.css(a.visible?d:e);a.setState()}).on("click",function(b){var c=function(){a.setVisible&&a.setVisible()},b={browserEvent:b};
a.firePointEvent?a.firePointEvent("legendItemClick",b,c):O(a,"legendItemClick",b,c)})},createCheckboxForItem:function(a){a.checkbox=fa("input",{type:"checkbox",checked:a.selected,defaultChecked:a.selected},this.options.itemCheckboxStyle,this.chart.container);E(a.checkbox,"click",function(b){O(a.series||a,"checkboxClick",{checked:b.target.checked,item:a},function(){a.select()})})}});R.legend.itemStyle.cursor="pointer";A(Ba.prototype,{showResetZoom:function(){var a=this,b=R.lang,c=a.options.chart.resetZoomButton,
d=c.theme,e=d.states,f=c.relativeTo==="chart"?null:"plotBox";this.resetZoomButton=a.renderer.button(b.resetZoom,null,null,function(){a.zoomOut()},d,e&&e.hover).attr({align:c.position.align,title:b.resetZoomTitle}).add().align(c.position,!1,f)},zoomOut:function(){var a=this;O(a,"selection",{resetSelection:!0},function(){a.zoom()})},zoom:function(a){var b,c=this.pointer,d=!1,e;!a||a.resetSelection?o(this.axes,function(a){b=a.zoom()}):o(a.xAxis.concat(a.yAxis),function(a){var e=a.axis,h=e.isXAxis;if(c[h?
"zoomX":"zoomY"]||c[h?"pinchX":"pinchY"])b=e.zoom(a.min,a.max),e.displayBtn&&(d=!0)});e=this.resetZoomButton;if(d&&!e)this.showResetZoom();else if(!d&&ea(e))this.resetZoomButton=e.destroy();b&&this.redraw(q(this.options.chart.animation,a&&a.animation,this.pointCount<100))},pan:function(a,b){var c=this,d=c.hoverPoints,e;d&&o(d,function(a){a.setState()});o(b==="xy"?[1,0]:[1],function(b){var b=c[b?"xAxis":"yAxis"][0],d=b.horiz,h=a[d?"chartX":"chartY"],d=d?"mouseDownX":"mouseDownY",i=c[d],j=(b.pointRange||
0)/2,k=b.getExtremes(),l=b.toValue(i-h,!0)+j,j=b.toValue(i+b.len-h,!0)-j,i=i>h;if(b.series.length&&(i||l>G(k.dataMin,k.min))&&(!i||j<w(k.dataMax,k.max)))b.setExtremes(l,j,!1,!1,{trigger:"pan"}),e=!0;c[d]=h});e&&c.redraw(!1);N(c.container,{cursor:"move"})}});A(Ha.prototype,{select:function(a,b){var c=this,d=c.series,e=d.chart,a=q(a,!c.selected);c.firePointEvent(a?"select":"unselect",{accumulate:b},function(){c.selected=c.options.selected=a;d.options.data[sa(c,d.data)]=c.options;c.setState(a&&"select");
b||o(e.getSelectedPoints(),function(a){if(a.selected&&a!==c)a.selected=a.options.selected=!1,d.options.data[sa(a,d.data)]=a.options,a.setState(""),a.firePointEvent("unselect")})})},onMouseOver:function(a,b){var c=this.series,d=c.chart,e=d.tooltip,f=d.hoverPoint;if(d.hoverSeries!==c)c.onMouseOver();if(f&&f!==this)f.onMouseOut();if(this.series&&(this.firePointEvent("mouseOver"),e&&(!e.shared||c.noSharedTooltip)&&e.refresh(this,a),this.setState("hover"),!b))d.hoverPoint=this},onMouseOut:function(){var a=
this.series.chart,b=a.hoverPoints;this.firePointEvent("mouseOut");if(!b||sa(this,b)===-1)this.setState(),a.hoverPoint=null},importEvents:function(){if(!this.hasImportedEvents){var a=z(this.series.options.point,this.options).events,b;this.events=a;for(b in a)E(this,b,a[b]);this.hasImportedEvents=!0}},setState:function(a,b){var c=V(this.plotX),d=this.plotY,e=this.series,f=e.options.states,g=W[e.type].marker&&e.options.marker,h=g&&!g.enabled,i=g&&g.states[a],j=i&&i.enabled===!1,k=e.stateMarkerGraphic,
l=this.marker||{},m=e.chart,n=e.halo,p,a=a||"";p=this.pointAttr[a]||e.pointAttr[a];if(!(a===this.state&&!b||this.selected&&a!=="select"||f[a]&&f[a].enabled===!1||a&&(j||h&&i.enabled===!1)||a&&l.states&&l.states[a]&&l.states[a].enabled===!1)){if(this.graphic)g=g&&this.graphic.symbolName&&p.r,this.graphic.attr(z(p,g?{x:c-g,y:d-g,width:2*g,height:2*g}:{})),k&&k.hide();else{if(a&&i)if(g=i.radius,l=l.symbol||e.symbol,k&&k.currentSymbol!==l&&(k=k.destroy()),k)k[b?"animate":"attr"]({x:c-g,y:d-g});else if(l)e.stateMarkerGraphic=
k=m.renderer.symbol(l,c-g,d-g,2*g,2*g).attr(p).add(e.markerGroup),k.currentSymbol=l;if(k)k[a&&m.isInsidePlot(c,d,m.inverted)?"show":"hide"](),k.element.point=this}if((c=f[a]&&f[a].halo)&&c.size){if(!n)e.halo=n=m.renderer.path().add(m.seriesGroup);n.attr(A({fill:this.color||e.color,"fill-opacity":c.opacity,zIndex:-1},c.attributes))[b?"animate":"attr"]({d:this.haloPath(c.size)})}else n&&n.attr({d:[]});this.state=a}},haloPath:function(a){var b=this.series,c=b.chart,d=b.getPlotBox(),e=c.inverted,f=Math.floor(this.plotX);
return c.renderer.symbols.circle(d.translateX+(e?b.yAxis.len-this.plotY:f)-a,d.translateY+(e?b.xAxis.len-f:this.plotY)-a,a*2,a*2)}});A(P.prototype,{onMouseOver:function(){var a=this.chart,b=a.hoverSeries;if(b&&b!==this)b.onMouseOut();this.options.events.mouseOver&&O(this,"mouseOver");this.setState("hover");a.hoverSeries=this},onMouseOut:function(){var a=this.options,b=this.chart,c=b.tooltip,d=b.hoverPoint;b.hoverSeries=null;if(d)d.onMouseOut();this&&a.events.mouseOut&&O(this,"mouseOut");c&&!a.stickyTracking&&
(!c.shared||this.noSharedTooltip)&&c.hide();this.setState()},setState:function(a){var b=this.options,c=this.graph,d=b.states,e=b.lineWidth,b=0,a=a||"";if(this.state!==a&&(this.state=a,!(d[a]&&d[a].enabled===!1)&&(a&&(e=d[a].lineWidth||e+(d[a].lineWidthPlus||0)),c&&!c.dashstyle))){a={"stroke-width":e};for(c.attr(a);this["zoneGraph"+b];)this["zoneGraph"+b].attr(a),b+=1}},setVisible:function(a,b){var c=this,d=c.chart,e=c.legendItem,f,g=d.options.chart.ignoreHiddenSeries,h=c.visible;f=(c.visible=a=c.userOptions.visible=
a===t?!h:a)?"show":"hide";o(["group","dataLabelsGroup","markerGroup","tracker"],function(a){if(c[a])c[a][f]()});if(d.hoverSeries===c||(d.hoverPoint&&d.hoverPoint.series)===c)c.onMouseOut();e&&d.legend.colorizeItem(c,a);c.isDirty=!0;c.options.stacking&&o(d.series,function(a){if(a.options.stacking&&a.visible)a.isDirty=!0});o(c.linkedSeries,function(b){b.setVisible(a,!1)});if(g)d.isDirtyBox=!0;b!==!1&&d.redraw();O(c,f)},show:function(){this.setVisible(!0)},hide:function(){this.setVisible(!1)},select:function(a){this.selected=
a=a===t?!this.selected:a;if(this.checkbox)this.checkbox.checked=a;O(this,a?"select":"unselect")},drawTracker:mb.drawTrackerGraph});U(P.prototype,"init",function(a){var b;a.apply(this,Array.prototype.slice.call(arguments,1));(b=this.xAxis)&&b.options.ordinal&&E(this,"updatedData",function(){delete b.ordinalIndex})});U(J.prototype,"getTimeTicks",function(a,b,c,d,e,f,g,h){var i=0,j,k,l={},m,n,p,o=[],q=-Number.MAX_VALUE,F=this.options.tickPixelInterval;if(!this.options.ordinal&&!this.options.breaks||
!f||f.length<3||c===t)return a.call(this,b,c,d,e);n=f.length;for(j=0;j<n;j++){p=j&&f[j-1]>d;f[j]<c&&(i=j);if(j===n-1||f[j+1]-f[j]>g*5||p){if(f[j]>q){for(k=a.call(this,b,f[i],f[j],e);k.length&&k[0]<=q;)k.shift();k.length&&(q=k[k.length-1]);o=o.concat(k)}i=j+1}if(p)break}a=k.info;if(h&&a.unitRange<=M.hour){j=o.length-1;for(i=1;i<j;i++)na("%d",o[i])!==na("%d",o[i-1])&&(l[o[i]]="day",m=!0);m&&(l[o[0]]="day");a.higherRanks=l}o.info=a;if(h&&v(F)){h=a=o.length;j=[];var u;for(m=[];h--;)i=this.translate(o[h]),
u&&(m[h]=u-i),j[h]=u=i;m.sort();m=m[V(m.length/2)];m<F*0.6&&(m=null);h=o[a-1]>d?a-1:a;for(u=void 0;h--;)i=j[h],d=u-i,u&&d<F*0.8&&(m===null||d<m*0.8)?(l[o[h]]&&!l[o[h+1]]?(d=h+1,u=i):d=h,o.splice(d,1)):u=i}return o});A(J.prototype,{beforeSetTickPositions:function(){var a,b=[],c=!1,d,e=this.getExtremes(),f=e.min,g=e.max,h,i=this.isXAxis&&!!this.options.breaks;if((e=this.options.ordinal)||i){o(this.series,function(c,d){if(c.visible!==!1&&(c.takeOrdinalPosition!==!1||i))if(b=b.concat(c.processedXData),
a=b.length,b.sort(function(a,b){return a-b}),a)for(d=a-1;d--;)b[d]===b[d+1]&&b.splice(d,1)});a=b.length;if(a>2){d=b[1]-b[0];for(h=a-1;h--&&!c;)b[h+1]-b[h]!==d&&(c=!0);if(!this.options.keepOrdinalPadding&&(b[0]-f>d||g-b[b.length-1]>d))c=!0}c?(this.ordinalPositions=b,d=this.val2lin(w(f,b[0]),!0),h=w(this.val2lin(G(g,b[b.length-1]),!0),1),this.ordinalSlope=g=(g-f)/(h-d),this.ordinalOffset=f-d*g):this.ordinalPositions=this.ordinalSlope=this.ordinalOffset=t}this.isOrdinal=e&&c;this.groupIntervalFactor=
null},val2lin:function(a,b){var c=this.ordinalPositions,d;if(c){var e=c.length,f;for(d=e;d--;)if(c[d]===a){f=d;break}for(d=e-1;d--;)if(a>c[d]||d===0){c=(a-c[d])/(c[d+1]-c[d]);f=d+c;break}d=b?f:this.ordinalSlope*(f||0)+this.ordinalOffset}else d=a;return d},lin2val:function(a,b){var c=this.ordinalPositions;if(c){var d=this.ordinalSlope,e=this.ordinalOffset,f=c.length-1,g,h;if(b)a<0?a=c[0]:a>f?a=c[f]:(f=V(a),h=a-f);else for(;f--;)if(g=d*f+e,a>=g){d=d*(f+1)+e;h=(a-g)/(d-g);break}c=h!==t&&c[f]!==t?c[f]+
(h?h*(c[f+1]-c[f]):0):a}else c=a;return c},getExtendedPositions:function(){var a=this.chart,b=this.series[0].currentDataGrouping,c=this.ordinalIndex,d=b?b.count+b.unitName:"raw",e=this.getExtremes(),f,g;if(!c)c=this.ordinalIndex={};if(!c[d])f={series:[],getExtremes:function(){return{min:e.dataMin,max:e.dataMax}},options:{ordinal:!0},val2lin:J.prototype.val2lin},o(this.series,function(c){g={xAxis:f,xData:c.xData,chart:a,destroyGroupedData:ra};g.options={dataGrouping:b?{enabled:!0,forced:!0,approximation:"open",
units:[[b.unitName,[b.count]]]}:{enabled:!1}};c.processData.apply(g);f.series.push(g)}),this.beforeSetTickPositions.apply(f),c[d]=f.ordinalPositions;return c[d]},getGroupIntervalFactor:function(a,b,c){var d,c=c.processedXData,e=c.length,f=[];d=this.groupIntervalFactor;if(!d){for(d=0;d<e-1;d++)f[d]=c[d+1]-c[d];f.sort(function(a,b){return a-b});f=f[V(e/2)];a=w(a,c[0]);b=G(b,c[e-1]);this.groupIntervalFactor=d=e*f/(b-a)}return d},postProcessTickInterval:function(a){var b=this.ordinalSlope;return b?this.options.breaks?
this.closestPointRange:a/(b/this.closestPointRange):a}});U(Ba.prototype,"pan",function(a,b){var c=this.xAxis[0],d=b.chartX,e=!1;if(c.options.ordinal&&c.series.length){var f=this.mouseDownX,g=c.getExtremes(),h=g.dataMax,i=g.min,j=g.max,k=this.hoverPoints,l=c.closestPointRange,f=(f-d)/(c.translationSlope*(c.ordinalSlope||l)),m={ordinalPositions:c.getExtendedPositions()},l=c.lin2val,n=c.val2lin,p;if(m.ordinalPositions){if(S(f)>1)k&&o(k,function(a){a.setState()}),f<0?(k=m,p=c.ordinalPositions?c:m):(k=
c.ordinalPositions?c:m,p=m),m=p.ordinalPositions,h>m[m.length-1]&&m.push(h),this.fixedRange=j-i,f=c.toFixedRange(null,null,l.apply(k,[n.apply(k,[i,!0])+f,!0]),l.apply(p,[n.apply(p,[j,!0])+f,!0])),f.min>=G(g.dataMin,i)&&f.max<=w(h,j)&&c.setExtremes(f.min,f.max,!0,!1,{trigger:"pan"}),this.mouseDownX=d,N(this.container,{cursor:"move"})}else e=!0}else e=!0;e&&a.apply(this,Array.prototype.slice.call(arguments,1))});P.prototype.gappedPath=function(){var a=this.options.gapSize,b=this.points.slice(),c=b.length-
1;if(a&&c>0)for(;c--;)b[c+1].x-b[c].x>this.closestPointRange*a&&b.splice(c+1,0,{isNull:!0});return this.getGraphPath(b)};(function(a){a(B)})(function(a){function b(){return Array.prototype.slice.call(arguments,1)}function c(a){a.apply(this);this.drawBreaks(this.xAxis,["x"]);this.drawBreaks(this.yAxis,d(this.pointArrayMap,["y"]))}var d=a.pick,e=a.wrap,f=a.each,g=a.extend,h=a.fireEvent,i=a.Axis,j=a.Series;g(i.prototype,{isInBreak:function(a,b){var c=a.repeat||Infinity,d=a.from,e=a.to-a.from,c=b>=d?
(b-d)%c:c-(d-b)%c;return a.inclusive?c<=e:c<e&&c!==0},isInAnyBreak:function(a,b){var c=this.options.breaks,e=c&&c.length,f,g,h;if(e){for(;e--;)this.isInBreak(c[e],a)&&(f=!0,g||(g=d(c[e].showPoints,this.isXAxis?!1:!0)));h=f&&b?f&&!g:f}return h}});e(i.prototype,"setTickPositions",function(a){a.apply(this,Array.prototype.slice.call(arguments,1));if(this.options.breaks){var b=this.tickPositions,c=this.tickPositions.info,d=[],e;for(e=0;e<b.length;e++)this.isInAnyBreak(b[e])||d.push(b[e]);this.tickPositions=
d;this.tickPositions.info=c}});e(i.prototype,"init",function(a,b,c){if(c.breaks&&c.breaks.length)c.ordinal=!1;a.call(this,b,c);if(this.options.breaks){var d=this;d.isBroken=!0;this.val2lin=function(a){var b=a,c,e;for(e=0;e<d.breakArray.length;e++)if(c=d.breakArray[e],c.to<=a)b-=c.len;else if(c.from>=a)break;else if(d.isInBreak(c,a)){b-=a-c.from;break}return b};this.lin2val=function(a){var b,c;for(c=0;c<d.breakArray.length;c++)if(b=d.breakArray[c],b.from>=a)break;else b.to<a?a+=b.len:d.isInBreak(b,
a)&&(a+=b.len);return a};this.setExtremes=function(a,b,c,d,e){for(;this.isInAnyBreak(a);)a-=this.closestPointRange;for(;this.isInAnyBreak(b);)b-=this.closestPointRange;i.prototype.setExtremes.call(this,a,b,c,d,e)};this.setAxisTranslation=function(a){i.prototype.setAxisTranslation.call(this,a);var b=d.options.breaks,a=[],c=[],e=0,f,g,k=d.userMin||d.min,j=d.userMax||d.max,l,m;for(m in b)g=b[m],f=g.repeat||Infinity,d.isInBreak(g,k)&&(k+=g.to%f-k%f),d.isInBreak(g,j)&&(j-=j%f-g.from%f);for(m in b){g=b[m];
l=g.from;for(f=g.repeat||Infinity;l-f>k;)l-=f;for(;l<k;)l+=f;for(;l<j;l+=f)a.push({value:l,move:"in"}),a.push({value:l+(g.to-g.from),move:"out",size:g.breakSize})}a.sort(function(a,b){return a.value===b.value?(a.move==="in"?0:1)-(b.move==="in"?0:1):a.value-b.value});b=0;l=k;for(m in a){g=a[m];b+=g.move==="in"?1:-1;if(b===1&&g.move==="in")l=g.value;b===0&&(c.push({from:l,to:g.value,len:g.value-l-(g.size||0)}),e+=g.value-l-(g.size||0))}d.breakArray=c;h(d,"afterBreaks");d.transA*=(j-d.min)/(j-k-e);d.min=
k;d.max=j}}});e(j.prototype,"generatePoints",function(a){a.apply(this,b(arguments));var c=this.xAxis,d=this.yAxis,e=this.points,f,g=e.length,h=this.options.connectNulls,i;if(c&&d&&(c.options.breaks||d.options.breaks))for(;g--;)if(f=e[g],i=f.y===null&&h===!1,!i&&(c.isInAnyBreak(f.x,!0)||d.isInAnyBreak(f.y,!0)))e.splice(g,1),this.data[g]&&this.data[g].destroyElements()});a.Series.prototype.drawBreaks=function(a,b){var c=this,e=c.points,g,i,j,o;f(b,function(b){g=a.breakArray||[];i=a.isXAxis?a.min:d(c.options.threshold,
a.min);f(e,function(c){o=d(c["stack"+b.toUpperCase()],c[b]);f(g,function(b){j=!1;if(i<b.from&&o>b.to||i>b.from&&o<b.from)j="pointBreak";else if(i<b.from&&o>b.from&&o<b.to||i>b.from&&o>b.to&&o<b.from)j="pointInBreak";j&&h(a,j,{point:c,brk:b})})})})};e(a.seriesTypes.column.prototype,"drawPoints",c);e(a.Series.prototype,"drawPoints",c)});var ia=P.prototype,cc=ia.processData,dc=ia.generatePoints,ec=ia.destroy,fc={approximation:"average",groupPixelWidth:2,dateTimeLabelFormats:{millisecond:["%A, %b %e, %H:%M:%S.%L",
"%A, %b %e, %H:%M:%S.%L","-%H:%M:%S.%L"],second:["%A, %b %e, %H:%M:%S","%A, %b %e, %H:%M:%S","-%H:%M:%S"],minute:["%A, %b %e, %H:%M","%A, %b %e, %H:%M","-%H:%M"],hour:["%A, %b %e, %H:%M","%A, %b %e, %H:%M","-%H:%M"],day:["%A, %b %e, %Y","%A, %b %e","-%A, %b %e, %Y"],week:["Week from %A, %b %e, %Y","%A, %b %e","-%A, %b %e, %Y"],month:["%B %Y","%B","-%B %Y"],year:["%Y","%Y","-%Y"]}},Xb={line:{},spline:{},area:{},areaspline:{},column:{approximation:"sum",groupPixelWidth:10},arearange:{approximation:"range"},
areasplinerange:{approximation:"range"},columnrange:{approximation:"range",groupPixelWidth:10},candlestick:{approximation:"ohlc",groupPixelWidth:10},ohlc:{approximation:"ohlc",groupPixelWidth:5}},Yb=[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],["hour",[1,2,3,4,6,8,12]],["day",[1]],["week",[1]],["month",[1,3,6]],["year",null]],Ta={sum:function(a){var b=a.length,c;if(!b&&a.hasNulls)c=null;else if(b)for(c=0;b--;)c+=a[b];return c},average:function(a){var b=
a.length,a=Ta.sum(a);C(a)&&b&&(a/=b);return a},open:function(a){return a.length?a[0]:a.hasNulls?null:t},high:function(a){return a.length?Da(a):a.hasNulls?null:t},low:function(a){return a.length?Ma(a):a.hasNulls?null:t},close:function(a){return a.length?a[a.length-1]:a.hasNulls?null:t},ohlc:function(a,b,c,d){a=Ta.open(a);b=Ta.high(b);c=Ta.low(c);d=Ta.close(d);if(C(a)||C(b)||C(c)||C(d))return[a,b,c,d]},range:function(a,b){a=Ta.low(a);b=Ta.high(b);if(C(a)||C(b))return[a,b]}};ia.groupData=function(a,
b,c,d){var e=this.data,f=this.options.data,g=[],h=[],i=[],j=a.length,k,l,m=!!b,n=[[],[],[],[]],d=typeof d==="function"?d:Ta[d],p=this.pointArrayMap,o=p&&p.length,q,v=0;for(q=0;q<=j;q++)if(a[q]>=c[0])break;for(;q<=j;q++){for(;c[1]!==t&&a[q]>=c[1]||q===j;)if(k=c.shift(),l=d.apply(0,n),l!==t&&(g.push(k),h.push(l),i.push({start:v,length:n[0].length})),v=q,n[0]=[],n[1]=[],n[2]=[],n[3]=[],q===j)break;if(q===j)break;if(p){k=this.cropStart+q;k=e&&e[k]||this.pointClass.prototype.applyOptions.apply({series:this},
[f[k]]);var u;for(l=0;l<o;l++)if(u=k[p[l]],C(u))n[l].push(u);else if(u===null)n[l].hasNulls=!0}else if(k=m?b[q]:null,C(k))n[0].push(k);else if(k===null)n[0].hasNulls=!0}return[g,h,i]};ia.processData=function(){var a=this.chart,b=this.options.dataGrouping,c=this.allowDG!==!1&&b&&q(b.enabled,a.options._stock),d;this.forceCrop=c;this.groupPixelWidth=null;this.hasProcessed=!0;if(cc.apply(this,arguments)!==!1&&c){this.destroyGroupedData();var e=this.processedXData,f=this.processedYData,g=a.plotSizeX,a=
this.xAxis,h=a.options.ordinal,i=this.groupPixelWidth=a.getGroupPixelWidth&&a.getGroupPixelWidth();if(i){d=!0;this.points=null;var j=a.getExtremes(),c=j.min,j=j.max,h=h&&a.getGroupIntervalFactor(c,j,this)||1,g=i*(j-c)/g*h,i=a.getTimeTicks(a.normalizeTimeTickInterval(g,b.units||Yb),Math.min(c,e[0]),Math.max(j,e[e.length-1]),a.options.startOfWeek,e,this.closestPointRange),e=ia.groupData.apply(this,[e,f,i,b.approximation]),f=e[0],h=e[1];if(b.smoothed){b=f.length-1;for(f[b]=Math.min(f[b],j);b--&&b>0;)f[b]+=
g/2;f[0]=Math.max(f[0],c)}this.currentDataGrouping=i.info;this.closestPointRange=i.info.totalRange;this.groupMap=e[2];if(v(f[0])&&f[0]<a.dataMin){if(a.min===a.dataMin)a.min=f[0];a.dataMin=f[0]}this.processedXData=f;this.processedYData=h}else this.currentDataGrouping=this.groupMap=null;this.hasGroupedData=d}};ia.destroyGroupedData=function(){var a=this.groupedData;o(a||[],function(b,c){b&&(a[c]=b.destroy?b.destroy():null)});this.groupedData=null};ia.generatePoints=function(){dc.apply(this);this.destroyGroupedData();
this.groupedData=this.hasGroupedData?this.points:null};U(Lb.prototype,"tooltipFooterHeaderFormatter",function(a,b,c){var d=b.series,e=d.tooltipOptions,f=d.options.dataGrouping,g=e.xDateFormat,h,i=d.xAxis;return i&&i.options.type==="datetime"&&f&&C(b.key)?(a=d.currentDataGrouping,f=f.dateTimeLabelFormats,a?(i=f[a.unitName],a.count===1?g=i[0]:(g=i[1],h=i[2])):!g&&f&&(g=this.getXDateFormat(b,e,i)),g=na(g,b.key),h&&(g+=na(h,b.key+a.totalRange-1)),La(e[(c?"footer":"header")+"Format"],{point:A(b,{key:g}),
series:d})):a.call(this,b,c)});ia.destroy=function(){for(var a=this.groupedData||[],b=a.length;b--;)a[b]&&a[b].destroy();ec.apply(this)};U(ia,"setOptions",function(a,b){var c=a.call(this,b),d=this.type,e=this.chart.options.plotOptions,f=W[d].dataGrouping;if(Xb[d])f||(f=z(fc,Xb[d])),c.dataGrouping=z(f,e.series&&e.series.dataGrouping,e[d].dataGrouping,b.dataGrouping);if(this.chart.options._stock)this.requireSorting=!0;return c});U(J.prototype,"setScale",function(a){a.call(this);o(this.series,function(a){a.hasProcessed=
!1})});J.prototype.getGroupPixelWidth=function(){var a=this.series,b=a.length,c,d=0,e=!1,f;for(c=b;c--;)(f=a[c].options.dataGrouping)&&(d=w(d,f.groupPixelWidth));for(c=b;c--;)if((f=a[c].options.dataGrouping)&&a[c].hasProcessed)if(b=(a[c].processedXData||a[c].data).length,a[c].groupPixelWidth||b>this.chart.plotSizeX/d||b&&f.forced)e=!0;return e?d:0};J.prototype.setDataGrouping=function(a,b){var c,b=q(b,!0);a||(a={forced:!1,units:null});if(this instanceof J)for(c=this.series.length;c--;)this.series[c].update({dataGrouping:a},
!1);else o(this.chart.options.series,function(b){b.dataGrouping=a},!1);b&&this.chart.redraw()};W.ohlc=z(W.column,{lineWidth:1,tooltip:{pointFormat:'<span style="color:{point.color}">\u25cf</span> <b> {series.name}</b><br/>Open: {point.open}<br/>High: {point.high}<br/>Low: {point.low}<br/>Close: {point.close}<br/>'},states:{hover:{lineWidth:3}},threshold:null});da=ma(I.column,{type:"ohlc",pointArrayMap:["open","high","low","close"],toYData:function(a){return[a.open,a.high,a.low,a.close]},pointValKey:"high",
pointAttrToOptions:{stroke:"color","stroke-width":"lineWidth"},upColorProp:"stroke",getAttribs:function(){I.column.prototype.getAttribs.apply(this,arguments);var a=this.options,b=a.states,a=a.upColor||this.color,c=z(this.pointAttr),d=this.upColorProp;c[""][d]=a;c.hover[d]=b.hover.upColor||a;c.select[d]=b.select.upColor||a;o(this.points,function(a){if(a.open<a.close&&!a.options.color)a.pointAttr=c})},translate:function(){var a=this.yAxis;I.column.prototype.translate.apply(this);o(this.points,function(b){if(b.open!==
null)b.plotOpen=a.translate(b.open,0,1,0,1);if(b.close!==null)b.plotClose=a.translate(b.close,0,1,0,1)})},drawPoints:function(){var a=this,b=a.chart,c,d,e,f,g,h,i,j;o(a.points,function(k){if(k.plotY!==t)i=k.graphic,c=k.pointAttr[k.selected?"selected":""]||a.pointAttr[""],f=c["stroke-width"]%2/2,j=y(k.plotX)-f,g=y(k.shapeArgs.width/2),h=["M",j,y(k.yBottom),"L",j,y(k.plotY)],k.open!==null&&(d=y(k.plotOpen)+f,h.push("M",j,d,"L",j-g,d)),k.close!==null&&(e=y(k.plotClose)+f,h.push("M",j,e,"L",j+g,e)),i?
i.attr(c).animate({d:h}):k.graphic=b.renderer.path(h).attr(c).add(a.group)})},animate:null});I.ohlc=da;W.candlestick=z(W.column,{lineColor:"black",lineWidth:1,states:{hover:{lineWidth:2}},tooltip:W.ohlc.tooltip,threshold:null,upColor:"white"});da=ma(da,{type:"candlestick",pointAttrToOptions:{fill:"color",stroke:"lineColor","stroke-width":"lineWidth"},upColorProp:"fill",getAttribs:function(){I.ohlc.prototype.getAttribs.apply(this,arguments);var a=this.options,b=a.states,c=a.upLineColor||a.lineColor,
d=b.hover.upLineColor||c,e=b.select.upLineColor||c;o(this.points,function(a){if(a.open<a.close){if(a.lineColor)a.pointAttr=z(a.pointAttr),c=a.lineColor;a.pointAttr[""].stroke=c;a.pointAttr.hover.stroke=d;a.pointAttr.select.stroke=e}})},drawPoints:function(){var a=this,b=a.chart,c,d=a.pointAttr[""],e,f,g,h,i,j,k,l,m,n,p;o(a.points,function(o){m=o.graphic;if(o.plotY!==t)c=o.pointAttr[o.selected?"selected":""]||d,k=c["stroke-width"]%2/2,l=y(o.plotX)-k,e=o.plotOpen,f=o.plotClose,g=Y.min(e,f),h=Y.max(e,
f),p=y(o.shapeArgs.width/2),i=y(g)!==y(o.plotY),j=h!==o.yBottom,g=y(g)+k,h=y(h)+k,n=[],n.push("M",l-p,h,"L",l-p,g,"L",l+p,g,"L",l+p,h,"Z","M",l,g,"L",l,i?y(o.plotY):g,"M",l,h,"L",l,j?y(o.yBottom):h),m?m.attr(c).animate({d:n}):o.graphic=b.renderer.path(n).attr(c).add(a.group).shadow(a.options.shadow)})}});I.candlestick=da;var vb=xa.prototype.symbols;W.flags=z(W.column,{fillColor:"white",lineWidth:1,pointRange:0,shape:"flag",stackDistance:12,states:{hover:{lineColor:"black",fillColor:"#FCFFC5"}},style:{fontSize:"11px",
fontWeight:"bold",textAlign:"center"},tooltip:{pointFormat:"{point.text}<br/>"},threshold:null,y:-30});I.flags=ma(I.column,{type:"flags",sorted:!1,noSharedTooltip:!0,allowDG:!1,takeOrdinalPosition:!1,trackerGroups:["markerGroup"],forceCrop:!0,init:P.prototype.init,pointAttrToOptions:{fill:"fillColor",stroke:"color","stroke-width":"lineWidth",r:"radius"},translate:function(){I.column.prototype.translate.apply(this);var a=this.options,b=this.chart,c=this.points,d=c.length-1,e,f,g=a.onSeries;e=g&&b.get(g);
var a=a.onKey||"y",g=e&&e.options.step,h=e&&e.points,i=h&&h.length,j=this.xAxis,k=j.getExtremes(),l,m,n;if(e&&e.visible&&i){e=e.currentDataGrouping;m=h[i-1].x+(e?e.totalRange:0);c.sort(function(a,b){return a.x-b.x});for(a="plot"+a[0].toUpperCase()+a.substr(1);i--&&c[d];)if(e=c[d],l=h[i],l.x<=e.x&&l[a]!==void 0){if(e.x<=m)e.plotY=l[a],l.x<e.x&&!g&&(n=h[i+1])&&n[a]!==t&&(e.plotY+=(e.x-l.x)/(n.x-l.x)*(n[a]-l[a]));d--;i++;if(d<0)break}}o(c,function(a,d){var e;if(a.plotY===t)a.x>=k.min&&a.x<=k.max?a.plotY=
b.chartHeight-j.bottom-(j.opposite?j.height:0)+j.offset-b.plotTop:a.shapeArgs={};if((f=c[d-1])&&f.plotX===a.plotX){if(f.stackIndex===t)f.stackIndex=0;e=f.stackIndex+1}a.stackIndex=e})},drawPoints:function(){var a,b=this.pointAttr[""],c=this.points,d=this.chart,e=d.renderer,f,g,h=this.options,i=h.y,j,k,l,m,n,p,o=this.yAxis;for(k=c.length;k--;)if(l=c[k],a=l.plotX>this.xAxis.len,f=l.plotX,f>0&&(f-=q(l.lineWidth,h.lineWidth)%2),m=l.stackIndex,j=l.options.shape||h.shape,g=l.plotY,g!==t&&(g=l.plotY+i-(m!==
t&&m*h.stackDistance)),n=m?t:l.plotX,p=m?t:l.plotY,m=l.graphic,g!==t&&f>=0&&!a)a=l.pointAttr[l.selected?"select":""]||b,m?m.attr({x:f,y:g,r:a.r,anchorX:n,anchorY:p}):l.graphic=e.label(l.options.title||h.title||"A",f,g,j,n,p,h.useHTML).css(z(h.style,l.style)).attr(a).attr({align:j==="flag"?"left":"center",width:h.width,height:h.height}).add(this.markerGroup).shadow(h.shadow),l.tooltipPos=d.inverted?[o.len+o.pos-d.plotLeft-g,this.xAxis.len-f]:[f,g];else if(m)l.graphic=m.destroy()},drawTracker:function(){var a=
this.points;mb.drawTrackerPoint.apply(this);o(a,function(b){var c=b.graphic;c&&E(c.element,"mouseover",function(){if(b.stackIndex>0&&!b.raised)b._y=c.y,c.attr({y:b._y-8}),b.raised=!0;o(a,function(a){if(a!==b&&a.raised&&a.graphic)a.graphic.attr({y:a._y}),a.raised=!1})})})},animate:ra,buildKDTree:ra,setClip:ra});vb.flag=function(a,b,c,d,e){return["M",e&&e.anchorX||a,e&&e.anchorY||b,"L",a,b+d,a,b,a+c,b,a+c,b+d,a,b+d,"Z"]};o(["circle","square"],function(a){vb[a+"pin"]=function(b,c,d,e,f){var g=f&&f.anchorX,
f=f&&f.anchorY;a==="circle"&&e>d&&(b-=y((e-d)/2),d=e);b=vb[a](b,c,d,e);g&&f&&b.push("M",g,c>f?c:c+e,"L",g,f);return b}});Xa===B.VMLRenderer&&o(["flag","circlepin","squarepin"],function(a){lb.prototype.symbols[a]=vb[a]});var da=[].concat(Yb),wb=function(a){var b=Fa(arguments,function(a){return C(a)});if(b.length)return Math[a].apply(0,b)};da[4]=["day",[1,2,3,4]];da[5]=["week",[1,2,3]];A(R,{navigator:{handles:{backgroundColor:"#ebe7e8",borderColor:"#b2b1b6"},height:40,margin:25,maskFill:"rgba(128,179,236,0.3)",
maskInside:!0,outlineColor:"#b2b1b6",outlineWidth:1,series:{type:I.areaspline===t?"line":"areaspline",color:"#4572A7",compare:null,fillOpacity:0.05,dataGrouping:{approximation:"average",enabled:!0,groupPixelWidth:2,smoothed:!0,units:da},dataLabels:{enabled:!1,zIndex:2},id:"highcharts-navigator-series",lineColor:null,lineWidth:1,marker:{enabled:!1},pointRange:0,shadow:!1,threshold:null},xAxis:{tickWidth:0,lineWidth:0,gridLineColor:"#EEE",gridLineWidth:1,tickPixelInterval:200,labels:{align:"left",style:{color:"#888"},
x:3,y:-4},crosshair:!1},yAxis:{gridLineWidth:0,startOnTick:!1,endOnTick:!1,minPadding:0.1,maxPadding:0.1,labels:{enabled:!1},crosshair:!1,title:{text:null},tickWidth:0}},scrollbar:{height:jb?20:14,barBackgroundColor:"#bfc8d1",barBorderRadius:0,barBorderWidth:1,barBorderColor:"#bfc8d1",buttonArrowColor:"#666",buttonBackgroundColor:"#ebe7e8",buttonBorderColor:"#bbb",buttonBorderRadius:0,buttonBorderWidth:1,minWidth:6,rifleColor:"#666",trackBackgroundColor:"#eeeeee",trackBorderColor:"#eeeeee",trackBorderWidth:1,
liveRedraw:ja&&!jb}});Gb.prototype={drawHandle:function(a,b){var c=this.chart.renderer,d=this.elementsToDestroy,e=this.handles,f=this.navigatorOptions.handles,f={fill:f.backgroundColor,stroke:f.borderColor,"stroke-width":1},g;this.rendered||(e[b]=c.g("navigator-handle-"+["left","right"][b]).css({cursor:"ew-resize"}).attr({zIndex:10-b}).add(),g=c.rect(-4.5,0,9,16,0,1).attr(f).add(e[b]),d.push(g),g=c.path(["M",-1.5,4,"L",-1.5,12,"M",0.5,4,"L",0.5,12]).attr(f).add(e[b]),d.push(g));e[b][this.rendered?
"animate":"attr"]({translateX:this.scrollerLeft+this.scrollbarHeight+parseInt(a,10),translateY:this.top+this.height/2-8})},drawScrollbarButton:function(a){var b=this.chart.renderer,c=this.elementsToDestroy,d=this.scrollbarButtons,e=this.scrollbarHeight,f=this.scrollbarOptions,g;this.rendered||(d[a]=b.g().add(this.scrollbarGroup),g=b.rect(-0.5,-0.5,e+1,e+1,f.buttonBorderRadius,f.buttonBorderWidth).attr({stroke:f.buttonBorderColor,"stroke-width":f.buttonBorderWidth,fill:f.buttonBackgroundColor}).add(d[a]),
c.push(g),g=b.path(["M",e/2+(a?-1:1),e/2-3,"L",e/2+(a?-1:1),e/2+3,e/2+(a?2:-2),e/2]).attr({fill:f.buttonArrowColor}).add(d[a]),c.push(g));a&&d[a].attr({translateX:this.scrollerWidth-e})},render:function(a,b,c,d){var e=this.chart,f=e.renderer,g,h,i,j,k=this.scrollbarGroup,l=this.navigatorGroup,m=this.scrollbar,l=this.xAxis,n=this.scrollbarTrack,p=this.scrollbarHeight,o=this.scrollbarEnabled,s=this.navigatorOptions,t=this.scrollbarOptions,u=t.minWidth,x=this.height,D=this.top,z=this.navigatorEnabled,
A=s.outlineWidth,B=A/2,E=0,H=this.outlineHeight,K=t.barBorderRadius,J=t.barBorderWidth,I=D+B,L=this.rendered;if(C(a)&&C(b)&&(!this.hasDragged||v(c))){this.navigatorLeft=g=q(l.left,e.plotLeft+p);this.navigatorWidth=h=q(l.len,e.plotWidth-2*p);this.scrollerLeft=i=g-p;this.scrollerWidth=j=j=h+2*p;c=q(c,l.translate(a));d=q(d,l.translate(b));if(!C(c)||S(c)===Infinity)c=0,d=j;if(!(l.translate(d,!0)-l.translate(c,!0)<e.xAxis[0].minRange)){this.zoomedMax=G(w(c,d,0),h);this.zoomedMin=G(w(this.fixedWidth?this.zoomedMax-
this.fixedWidth:G(c,d),0),h);this.range=this.zoomedMax-this.zoomedMin;c=y(this.zoomedMax);b=y(this.zoomedMin);a=c-b;if(!L){if(z)this.navigatorGroup=l=f.g("navigator").attr({zIndex:3}).add(),this.leftShade=f.rect().attr({fill:s.maskFill}).add(l),s.maskInside?this.leftShade.css({cursor:"ew-resize"}):this.rightShade=f.rect().attr({fill:s.maskFill}).add(l),this.outline=f.path().attr({"stroke-width":A,stroke:s.outlineColor}).add(l);if(o)this.scrollbarGroup=k=f.g("scrollbar").add(),m=t.trackBorderWidth,
this.scrollbarTrack=n=f.rect().attr({x:0,y:-m%2/2,fill:t.trackBackgroundColor,stroke:t.trackBorderColor,"stroke-width":m,r:t.trackBorderRadius||0,height:p}).add(k),this.scrollbar=m=f.rect().attr({y:-J%2/2,height:p,fill:t.barBackgroundColor,stroke:t.barBorderColor,"stroke-width":J,r:K}).add(k),this.scrollbarRifles=f.path().attr({stroke:t.rifleColor,"stroke-width":1}).add(k)}f=L?"animate":"attr";if(z){this.leftShade[f](s.maskInside?{x:g+b,y:D,width:c-b,height:x}:{x:g,y:D,width:b,height:x});if(this.rightShade)this.rightShade[f]({x:g+
c,y:D,width:h-c,height:x});this.outline[f]({d:["M",i,I,"L",g+b-B,I,g+b-B,I+H,"L",g+c-B,I+H,"L",g+c-B,I,i+j,I].concat(s.maskInside?["M",g+b+B,I,"L",g+c-B,I]:[])});this.drawHandle(b+B,0);this.drawHandle(c+B,1)}if(o&&k)this.drawScrollbarButton(0),this.drawScrollbarButton(1),k[f]({translateX:i,translateY:y(I+x)}),n[f]({width:j}),g=p+b,h=a-J,h<u&&(E=(u-h)/2,h=u,g-=E),this.scrollbarPad=E,m[f]({x:V(g)+J%2/2,width:h}),u=p+b+a/2-0.5,this.scrollbarRifles.attr({visibility:a>12?"visible":"hidden"})[f]({d:["M",
u-3,p/4,"L",u-3,2*p/3,"M",u,p/4,"L",u,2*p/3,"M",u+3,p/4,"L",u+3,2*p/3]});this.scrollbarPad=E;this.rendered=!0}}},addEvents:function(){var a=this.chart,b=a.container,c=this.mouseDownHandler,d=this.mouseMoveHandler,e=this.mouseUpHandler,f;f=[[b,"mousedown",c],[b,"mousemove",d],[H,"mouseup",e]];cb&&f.push([b,"touchstart",c],[b,"touchmove",d],[H,"touchend",e]);o(f,function(a){E.apply(null,a)});this._events=f;this.series&&E(this.series.xAxis,"foundExtremes",function(){a.scroller.modifyNavigatorAxisExtremes()});
E(a,"redraw",function(){var a=this.scroller,b;if(a)(b=a.baseSeries.xAxis)&&a.render(b.min,b.max)})},removeEvents:function(){o(this._events,function(a){T.apply(null,a)});this._events=t;this.navigatorEnabled&&this.baseSeries&&T(this.baseSeries,"updatedData",this.updatedDataHandler)},init:function(){var a=this,b=a.chart,c,d,e=a.scrollbarHeight,f=a.navigatorOptions,g=a.height,h=a.top,i,j=a.baseSeries;a.mouseDownHandler=function(d){var d=b.pointer.normalize(d),e=a.zoomedMin,f=a.zoomedMax,h=a.top,j=a.scrollbarHeight,
k=a.scrollerLeft,l=a.scrollerWidth,o=a.navigatorLeft,q=a.navigatorWidth,v=a.scrollbarPad,t=a.range,w=d.chartX,y=d.chartY,d=b.xAxis[0],z,A=jb?10:7;if(y>h&&y<h+g+j)if((h=!a.scrollbarEnabled||y<h+g)&&Y.abs(w-e-o)<A)a.grabbedLeft=!0,a.otherHandlePos=f,a.fixedExtreme=d.max,b.fixedRange=null;else if(h&&Y.abs(w-f-o)<A)a.grabbedRight=!0,a.otherHandlePos=e,a.fixedExtreme=d.min,b.fixedRange=null;else if(w>o+e-v&&w<o+f+v)a.grabbedCenter=w,a.fixedWidth=t,i=w-e;else if(w>k&&w<k+l){f=h?w-o-t/2:w<o?e-t*0.2:w>k+
l-j?e+t*0.2:w<o+e?e-t:f;if(f<0)f=0;else if(f+t>=q)f=q-t,z=a.getUnionExtremes().dataMax;if(f!==e)a.fixedWidth=t,e=c.toFixedRange(f,f+t,null,z),d.setExtremes(e.min,e.max,!0,!1,{trigger:"navigator"})}};a.mouseMoveHandler=function(c){var d=a.scrollbarHeight,e=a.navigatorLeft,f=a.navigatorWidth,g=a.scrollerLeft,h=a.scrollerWidth,j=a.range,k,l;if(!c.touches||c.touches[0].pageX!==0)c=b.pointer.normalize(c),k=c.chartX,k<e?k=e:k>g+h-d&&(k=g+h-d),a.grabbedLeft?(l=!0,a.render(0,0,k-e,a.otherHandlePos)):a.grabbedRight?
(l=!0,a.render(0,0,a.otherHandlePos,k-e)):a.grabbedCenter&&(l=!0,k<i?k=i:k>f+i-j&&(k=f+i-j),a.render(0,0,k-i,k-i+j)),l&&a.scrollbarOptions.liveRedraw&&setTimeout(function(){a.mouseUpHandler(c)},0),a.hasDragged=l};a.mouseUpHandler=function(d){var e,f;if(a.hasDragged){if(a.zoomedMin===a.otherHandlePos)e=a.fixedExtreme;else if(a.zoomedMax===a.otherHandlePos)f=a.fixedExtreme;if(a.zoomedMax===a.navigatorWidth)f=a.getUnionExtremes().dataMax;e=c.toFixedRange(a.zoomedMin,a.zoomedMax,e,f);v(e.min)&&b.xAxis[0].setExtremes(e.min,
e.max,!0,!1,{trigger:"navigator",triggerOp:"navigator-drag",DOMEvent:d})}if(d.type!=="mousemove")a.grabbedLeft=a.grabbedRight=a.grabbedCenter=a.fixedWidth=a.fixedExtreme=a.otherHandlePos=a.hasDragged=i=null};var k=b.xAxis.length,l=b.yAxis.length;b.extraBottomMargin=a.outlineHeight+f.margin;a.navigatorEnabled?(a.xAxis=c=new J(b,z({breaks:j&&j.xAxis.options.breaks,ordinal:j&&j.xAxis.options.ordinal},f.xAxis,{id:"navigator-x-axis",isX:!0,type:"datetime",index:k,height:g,offset:0,offsetLeft:e,offsetRight:-e,
keepOrdinalPadding:!0,startOnTick:!1,endOnTick:!1,minPadding:0,maxPadding:0,zoomEnabled:!1})),a.yAxis=d=new J(b,z(f.yAxis,{id:"navigator-y-axis",alignTicks:!1,height:g,offset:0,index:l,zoomEnabled:!1})),j||f.series.data?a.addBaseSeries():b.series.length===0&&U(b,"redraw",function(c,d){if(b.series.length>0&&!a.series)a.setBaseSeries(),b.redraw=c;c.call(b,d)})):a.xAxis=c={translate:function(a,c){var d=b.xAxis[0],f=d.getExtremes(),g=b.plotWidth-2*e,h=wb("min",d.options.min,f.dataMin),d=wb("max",d.options.max,
f.dataMax)-h;return c?a*d/g+h:g*(a-h)/d},toFixedRange:J.prototype.toFixedRange};if(j&&j.xAxis&&this.navigatorOptions.adaptToUpdatedData!==!1)E(j,"updatedData",this.updatedDataHandler),E(j.xAxis,"foundExtremes",function(){j.xAxis&&this.chart.scroller.modifyBaseAxisExtremes()}),j.userOptions.events=A(j.userOptions.event,{updatedData:this.updatedDataHandler});U(b,"getMargins",function(b){var e=this.legend,f=e.options;b.apply(this,[].slice.call(arguments,1));a.top=h=a.navigatorOptions.top||this.chartHeight-
a.height-a.scrollbarHeight-this.spacing[2]-(f.verticalAlign==="bottom"&&f.enabled&&!f.floating?e.legendHeight+q(f.margin,10):0);if(c&&d)c.options.top=d.options.top=h,c.setAxisSize(),d.setAxisSize()});a.addEvents()},getUnionExtremes:function(a){var b=this.chart.xAxis[0],c=this.xAxis,d=c.options,e=b.options,f;if(!a||b.dataMin!==null)f={dataMin:q(d&&d.min,wb("min",e.min,b.dataMin,c.dataMin,c.min)),dataMax:q(d&&d.max,wb("max",e.max,b.dataMax,c.dataMax,c.max))};return f},setBaseSeries:function(a){var b=
this.chart,a=a||b.options.navigator.baseSeries;this.series&&this.series.remove();this.baseSeries=b.series[a]||typeof a==="string"&&b.get(a)||b.series[0];this.xAxis&&this.addBaseSeries()},addBaseSeries:function(){var a=this.baseSeries,b=a?a.options:{},a=b.data,c=this.navigatorOptions.series,d;d=c.data;this.hasNavigatorData=!!d;b=z(b,c,{enableMouseTracking:!1,group:"nav",padXAxis:!1,xAxis:"navigator-x-axis",yAxis:"navigator-y-axis",name:"Navigator",showInLegend:!1,stacking:!1,isInternal:!0,visible:!0});
b.data=d||a.slice(0);this.series=this.chart.initSeries(b)},modifyNavigatorAxisExtremes:function(){var a=this.xAxis,b;if(a.getExtremes&&(b=this.getUnionExtremes(!0))&&(b.dataMin!==a.min||b.dataMax!==a.max))a.min=b.dataMin,a.max=b.dataMax},modifyBaseAxisExtremes:function(){var a=this.baseSeries.xAxis,b=a.getExtremes(),c=b.dataMin,d=b.dataMax,b=b.max-b.min,e=this.stickToMin,f=this.stickToMax,g,h,i=this.series,j=!!a.setExtremes;e&&(h=c,g=h+b);f&&(g=d,e||(h=w(g-b,i?i.xData[0]:-Number.MAX_VALUE)));if(j&&
(e||f)&&C(h))a.min=a.userMin=h,a.max=a.userMax=g;this.stickToMin=this.stickToMax=null},updatedDataHandler:function(){var a=this.chart.scroller,b=a.baseSeries,c=a.series;a.stickToMin=b.xAxis.min<=b.xData[0];a.stickToMax=a.zoomedMax>=a.navigatorWidth;if(c&&!a.hasNavigatorData&&(c.options.pointStart=b.xData[0],c.setData(b.options.data,!1),c.graph&&b.graph))c.graph.shift=b.graph.shift},destroy:function(){this.removeEvents();o([this.xAxis,this.yAxis,this.leftShade,this.rightShade,this.outline,this.scrollbarTrack,
this.scrollbarRifles,this.scrollbarGroup,this.scrollbar],function(a){a&&a.destroy&&a.destroy()});this.xAxis=this.yAxis=this.leftShade=this.rightShade=this.outline=this.scrollbarTrack=this.scrollbarRifles=this.scrollbarGroup=this.scrollbar=null;o([this.scrollbarButtons,this.handles,this.elementsToDestroy],function(a){Pa(a)})}};B.Scroller=Gb;U(J.prototype,"zoom",function(a,b,c){var d=this.chart,e=d.options,f=e.chart.zoomType,g=e.navigator,e=e.rangeSelector,h;if(this.isXAxis&&(g&&g.enabled||e&&e.enabled))if(f===
"x")d.resetZoomButton="blocked";else if(f==="y")h=!1;else if(f==="xy")d=this.previousZoom,v(b)?this.previousZoom=[this.min,this.max]:d&&(b=d[0],c=d[1],delete this.previousZoom);return h!==t?h:a.call(this,b,c)});U(Ba.prototype,"init",function(a,b,c){E(this,"beforeRender",function(){var a=this.options;if(a.navigator.enabled||a.scrollbar.enabled)this.scroller=new Gb(this)});a.call(this,b,c)});U(P.prototype,"addPoint",function(a,b,c,d,e){var f=this.options.turboThreshold;f&&this.xData.length>f&&ea(b)&&
!Ja(b)&&this.chart.scroller&&ga(20,!0);a.call(this,b,c,d,e)});A(R,{rangeSelector:{buttonTheme:{width:28,height:18,fill:"#f7f7f7",padding:2,r:0,"stroke-width":0,style:{color:"#444",cursor:"pointer",fontWeight:"normal"},zIndex:7,states:{hover:{fill:"#e7e7e7"},select:{fill:"#e7f0f9",style:{color:"black",fontWeight:"bold"}}}},height:35,inputPosition:{align:"right"},labelStyle:{color:"#666"}}});R.lang=z(R.lang,{rangeSelectorZoom:"Zoom",rangeSelectorFrom:"From",rangeSelectorTo:"To"});Hb.prototype={clickButton:function(a,
b){var c=this,d=c.selected,e=c.chart,f=c.buttons,g=c.buttonOptions[a],h=e.xAxis[0],i=e.scroller&&e.scroller.getUnionExtremes()||h||{},j=i.dataMin,k=i.dataMax,l,m=h&&y(G(h.max,q(k,h.max))),n=g.type,p,i=g._range,r,s,v,u=g.dataGrouping;if(!(j===null||k===null||a===c.selected)){e.fixedRange=i;if(u)this.forcedDataGrouping=!0,J.prototype.setDataGrouping.call(h||{chart:this.chart},u,!1);if(n==="month"||n==="year")if(h){if(n={range:g,max:m,dataMin:j,dataMax:k},l=h.minFromRange.call(n),C(n.newMax))m=n.newMax}else i=
g;else if(i)l=w(m-i,j),m=G(l+i,k);else if(n==="ytd")if(h){if(k===t)j=Number.MAX_VALUE,k=Number.MIN_VALUE,o(e.series,function(a){a=a.xData;j=G(a[0],j);k=w(a[a.length-1],k)}),b=!1;m=new ba(k);l=m.getFullYear();l=r=w(j||0,ba.UTC(l,0,1));m=m.getTime();m=G(k||m,m)}else{E(e,"beforeRender",function(){c.clickButton(a)});return}else n==="all"&&h&&(l=j,m=k);f[d]&&f[d].setState(0);if(f[a])f[a].setState(2),c.lastSelected=a;h?(h.setExtremes(l,m,q(b,1),0,{trigger:"rangeSelectorButton",rangeSelectorButton:g}),c.setSelected(a)):
(p=e.options.xAxis[0],v=p.range,p.range=i,s=p.min,p.min=r,c.setSelected(a),E(e,"load",function(){p.range=v;p.min=s}))}},setSelected:function(a){this.selected=this.options.selected=a},defaultButtons:[{type:"month",count:1,text:"1m"},{type:"month",count:3,text:"3m"},{type:"month",count:6,text:"6m"},{type:"ytd",text:"YTD"},{type:"year",count:1,text:"1y"},{type:"all",text:"All"}],init:function(a){var b=this,c=a.options.rangeSelector,d=c.buttons||[].concat(b.defaultButtons),e=c.selected,f=b.blurInputs=
function(){var a=b.minInput,c=b.maxInput;a&&a.blur&&O(a,"blur");c&&c.blur&&O(c,"blur")};b.chart=a;b.options=c;b.buttons=[];a.extraTopMargin=c.height;b.buttonOptions=d;E(a.container,"mousedown",f);E(a,"resize",f);o(d,b.computeButtonRange);e!==t&&d[e]&&this.clickButton(e,!1);E(a,"load",function(){E(a.xAxis[0],"setExtremes",function(c){this.max-this.min!==a.fixedRange&&c.trigger!=="rangeSelectorButton"&&c.trigger!=="updatedData"&&b.forcedDataGrouping&&this.setDataGrouping(!1,!1)});E(a.xAxis[0],"afterSetExtremes",
function(){b.updateButtonStates(!0)})})},updateButtonStates:function(a){var b=this,c=this.chart,d=c.xAxis[0],e=c.scroller&&c.scroller.getUnionExtremes()||d,f=e.dataMin,g=e.dataMax,h=b.selected,i=b.options.allButtonsEnabled,j=b.buttons;a&&c.fixedRange!==y(d.max-d.min)&&(j[h]&&j[h].setState(0),b.setSelected(null));o(b.buttonOptions,function(a,e){var m=y(d.max-d.min),n=a._range,o=a.type,q=a.count||1,s=n>g-f,t=n<d.minRange,u=a.type==="all"&&d.max-d.min>=g-f&&j[e].state!==2,v=a.type==="ytd"&&na("%Y",f)===
na("%Y",g),w=c.renderer.forExport&&e===h,n=n===m,z=!d.hasVisibleSeries;if((o==="month"||o==="year")&&m>={month:28,year:365}[o]*864E5*q&&m<={month:31,year:366}[o]*864E5*q)n=!0;w||n&&e!==h&&e===b.lastSelected?(b.setSelected(e),j[e].setState(2)):!i&&(s||t||u||v||z)?j[e].setState(3):j[e].state===3&&j[e].setState(0)})},computeButtonRange:function(a){var b=a.type,c=a.count||1,d={millisecond:1,second:1E3,minute:6E4,hour:36E5,day:864E5,week:6048E5};if(d[b])a._range=d[b]*c;else if(b==="month"||b==="year")a._range=
{month:30,year:365}[b]*864E5*c},setInputValue:function(a,b){var c=this.chart.options.rangeSelector;if(v(b))this[a+"Input"].HCTime=b;this[a+"Input"].value=na(c.inputEditDateFormat||"%Y-%m-%d",this[a+"Input"].HCTime);this[a+"DateBox"].attr({text:na(c.inputDateFormat||"%b %e, %Y",this[a+"Input"].HCTime)})},showInput:function(a){var b=this.inputGroup,c=this[a+"DateBox"];N(this[a+"Input"],{left:b.translateX+c.x+"px",top:b.translateY+"px",width:c.width-2+"px",height:c.height-2+"px",border:"2px solid silver"})},
hideInput:function(a){N(this[a+"Input"],{border:0,width:"1px",height:"1px"});this.setInputValue(a)},drawInput:function(a){function b(){var a=j.value,b=(g.inputDateParser||ba.parse)(a),e=d.xAxis[0],f=e.dataMin,h=e.dataMax;if(b!==j.previousValue)j.previousValue=b,C(b)||(b=a.split("-"),b=ba.UTC(K(b[0]),K(b[1])-1,K(b[2]))),C(b)&&(R.global.useUTC||(b+=(new ba).getTimezoneOffset()*6E4),i?b>c.maxInput.HCTime?b=t:b<f&&(b=f):b<c.minInput.HCTime?b=t:b>h&&(b=h),b!==t&&d.xAxis[0].setExtremes(i?b:e.min,i?e.max:
b,t,t,{trigger:"rangeSelectorInput"}))}var c=this,d=c.chart,e=d.renderer.style,f=d.renderer,g=d.options.rangeSelector,h=c.div,i=a==="min",j,k,l=this.inputGroup;this[a+"Label"]=k=f.label(R.lang[i?"rangeSelectorFrom":"rangeSelectorTo"],this.inputGroup.offset).attr({padding:2}).css(z(e,g.labelStyle)).add(l);l.offset+=k.width+5;this[a+"DateBox"]=f=f.label("",l.offset).attr({padding:2,width:g.inputBoxWidth||90,height:g.inputBoxHeight||17,stroke:g.inputBoxBorderColor||"silver","stroke-width":1}).css(z({textAlign:"center",
color:"#444"},e,g.inputStyle)).on("click",function(){c.showInput(a);c[a+"Input"].focus()}).add(l);l.offset+=f.width+(i?10:0);this[a+"Input"]=j=fa("input",{name:a,className:"highcharts-range-selector",type:"text"},A({position:"absolute",border:0,width:"1px",height:"1px",padding:0,textAlign:"center",fontSize:e.fontSize,fontFamily:e.fontFamily,left:"-9em",top:d.plotTop+"px"},g.inputStyle),h);j.onfocus=function(){c.showInput(a)};j.onblur=function(){c.hideInput(a)};j.onchange=b;j.onkeypress=function(a){a.keyCode===
13&&b()}},getPosition:function(){var a=this.chart,b=a.options.rangeSelector,a=q((b.buttonPosition||{}).y,a.plotTop-a.axisOffset[0]-b.height);return{buttonTop:a,inputTop:a-10}},render:function(a,b){var c=this,d=c.chart,e=d.renderer,f=d.container,g=d.options,h=g.exporting&&g.exporting.enabled!==!1&&g.navigation&&g.navigation.buttonOptions,i=g.rangeSelector,j=c.buttons,g=R.lang,k=c.div,k=c.inputGroup,l=i.buttonTheme,m=i.buttonPosition||{},n=i.inputEnabled,p=l&&l.states,r=d.plotLeft,s,t=this.getPosition(),
u=c.group,w=c.rendered;if(!w&&(c.group=u=e.g("range-selector-buttons").add(),c.zoomText=e.text(g.rangeSelectorZoom,q(m.x,r),15).css(i.labelStyle).add(u),s=q(m.x,r)+c.zoomText.getBBox().width+5,o(c.buttonOptions,function(a,b){j[b]=e.button(a.text,s,0,function(){c.clickButton(b);c.isActive=!0},l,p&&p.hover,p&&p.select,p&&p.disabled).css({textAlign:"center"}).add(u);s+=j[b].width+q(i.buttonSpacing,5);c.selected===b&&j[b].setState(2)}),c.updateButtonStates(),n!==!1))c.div=k=fa("div",null,{position:"relative",
height:0,zIndex:1}),f.parentNode.insertBefore(k,f),c.inputGroup=k=e.g("input-group").add(),k.offset=0,c.drawInput("min"),c.drawInput("max");u[w?"animate":"attr"]({translateY:t.buttonTop});n!==!1&&(k.align(A({y:t.inputTop,width:k.offset,x:h&&t.inputTop<(h.y||0)+h.height-d.spacing[0]?-40:0},i.inputPosition),!0,d.spacingBox),v(n)||(d=u.getBBox(),k[k.translateX<d.x+d.width+10?"hide":"show"]()),c.setInputValue("min",a),c.setInputValue("max",b));c.rendered=!0},destroy:function(){var a=this.minInput,b=this.maxInput,
c=this.chart,d=this.blurInputs,e;T(c.container,"mousedown",d);T(c,"resize",d);Pa(this.buttons);if(a)a.onfocus=a.onblur=a.onchange=null;if(b)b.onfocus=b.onblur=b.onchange=null;for(e in this)this[e]&&e!=="chart"&&(this[e].destroy?this[e].destroy():this[e].nodeType&&Ua(this[e])),this[e]=null}};J.prototype.toFixedRange=function(a,b,c,d){var e=this.chart&&this.chart.fixedRange,a=q(c,this.translate(a,!0)),b=q(d,this.translate(b,!0)),c=e&&(b-a)/e;c>0.7&&c<1.3&&(d?a=b-e:b=a+e);C(a)||(a=b=void 0);return{min:a,
max:b}};J.prototype.minFromRange=function(){var a=this.range,b={month:"Month",year:"FullYear"}[a.type],c,d=this.max,e,f,g=function(a,c){var d=new ba(a);d["set"+b](d["get"+b]()+c);return d.getTime()-a};C(a)?(c=this.max-a,f=a):c=d+g(d,-a.count);e=q(this.dataMin,Number.MIN_VALUE);C(c)||(c=e);if(c<=e)c=e,f===void 0&&(f=g(c,a.count)),this.newMax=G(c+f,this.dataMax);C(d)||(c=void 0);return c};U(Ba.prototype,"init",function(a,b,c){E(this,"init",function(){if(this.options.rangeSelector.enabled)this.rangeSelector=
new Hb(this)});a.call(this,b,c)});B.RangeSelector=Hb;Ba.prototype.callbacks.push(function(a){function b(){d=a.xAxis[0].getExtremes();C(d.min)&&f.render(d.min,d.max)}function c(a){f.render(a.min,a.max)}var d,e=a.scroller,f=a.rangeSelector;e&&(d=a.xAxis[0].getExtremes(),e.render(d.min,d.max));f&&(E(a.xAxis[0],"afterSetExtremes",c),E(a,"resize",b),b());E(a,"destroy",function(){f&&(T(a,"resize",b),T(a.xAxis[0],"afterSetExtremes",c))})});B.StockChart=B.stockChart=function(a,b,c){var d=Ca(a)||a.nodeName,
e=arguments[d?1:0],f=e.series,g,h=q(e.navigator&&e.navigator.enabled,!0)?{startOnTick:!1,endOnTick:!1}:null,i={marker:{enabled:!1,radius:2}},j={shadow:!1,borderWidth:0};e.xAxis=ta(ua(e.xAxis||{}),function(a){return z({minPadding:0,maxPadding:0,ordinal:!0,title:{text:null},labels:{overflow:"justify"},showLastLabel:!0},a,{type:"datetime",categories:null},h)});e.yAxis=ta(ua(e.yAxis||{}),function(a){g=q(a.opposite,!0);return z({labels:{y:-2},opposite:g,showLastLabel:!1,title:{text:null}},a)});e.series=
null;e=z({chart:{panning:!0,pinchType:"x"},navigator:{enabled:!0},scrollbar:{enabled:!0},rangeSelector:{enabled:!0},title:{text:null,style:{fontSize:"16px"}},tooltip:{shared:!0,crosshairs:!0},legend:{enabled:!1},plotOptions:{line:i,spline:i,area:i,areaspline:i,arearange:i,areasplinerange:i,column:j,columnrange:j,candlestick:j,ohlc:j}},e,{_stock:!0,chart:{inverted:!1}});e.series=f;return d?new Ba(a,e,c):new Ba(e,b)};U(Ya.prototype,"init",function(a,b,c){var d=c.chart.pinchType||"";a.call(this,b,c);
this.pinchX=this.pinchHor=d.indexOf("x")!==-1;this.pinchY=this.pinchVert=d.indexOf("y")!==-1;this.hasZoom=this.hasZoom||this.pinchHor||this.pinchVert});U(J.prototype,"autoLabelAlign",function(a){var b=this.chart,c=this.options,b=b._labelPanes=b._labelPanes||{},d=this.options.labels;if(this.chart.options._stock&&this.coll==="yAxis"&&(c=c.top+","+c.height,!b[c]&&d.enabled)){if(d.x===15)d.x=0;if(d.align===void 0)d.align="right";b[c]=1;return"right"}return a.call(this,[].slice.call(arguments,1))});U(J.prototype,
"getPlotLinePath",function(a,b,c,d,e,f){var g=this,h=this.isLinked&&!this.series?this.linkedParent.series:this.series,i=g.chart,j=i.renderer,k=g.left,l=g.top,m,n,p,r,s=[],t=[],u,x;if(g.coll==="colorAxis")return a.apply(this,[].slice.call(arguments,1));t=g.isXAxis?v(g.options.yAxis)?[i.yAxis[g.options.yAxis]]:ta(h,function(a){return a.yAxis}):v(g.options.xAxis)?[i.xAxis[g.options.xAxis]]:ta(h,function(a){return a.xAxis});o(g.isXAxis?i.yAxis:i.xAxis,function(a){if(v(a.options.id)?a.options.id.indexOf("navigator")===
-1:1){var b=a.isXAxis?"yAxis":"xAxis",b=v(a.options[b])?i[b][a.options[b]]:i[b][0];g===b&&t.push(a)}});u=t.length?[]:[g.isXAxis?i.yAxis[0]:i.xAxis[0]];o(t,function(a){sa(a,u)===-1&&u.push(a)});x=q(f,g.translate(b,null,null,d));C(x)&&(g.horiz?o(u,function(a){var b;n=a.pos;r=n+a.len;m=p=y(x+g.transB);if(m<k||m>k+g.width)e?m=p=G(w(k,m),k+g.width):b=!0;b||s.push("M",m,n,"L",p,r)}):o(u,function(a){var b;m=a.pos;p=m+a.len;n=r=y(l+g.height-x);if(n<l||n>l+g.height)e?n=r=G(w(l,n),g.top+g.height):b=!0;b||s.push("M",
m,n,"L",p,r)}));return s.length>0?j.crispPolyLine(s,c||1):null});J.prototype.getPlotBandPath=function(a,b){var c=this.getPlotLinePath(b,null,null,!0),d=this.getPlotLinePath(a,null,null,!0),e=[],f;if(d&&c&&d.toString()!==c.toString())for(f=0;f<d.length;f+=6)e.push("M",d[f+1],d[f+2],"L",d[f+4],d[f+5],c[f+4],c[f+5],c[f+1],c[f+2]);else e=null;return e};xa.prototype.crispPolyLine=function(a,b){var c;for(c=0;c<a.length;c+=6)a[c+1]===a[c+4]&&(a[c+1]=a[c+4]=y(a[c+1])-b%2/2),a[c+2]===a[c+5]&&(a[c+2]=a[c+5]=
y(a[c+2])+b%2/2);return a};if(Xa===B.VMLRenderer)lb.prototype.crispPolyLine=xa.prototype.crispPolyLine;U(J.prototype,"hideCrosshair",function(a,b){a.call(this,b);if(this.crossLabel)this.crossLabel=this.crossLabel.hide()});U(J.prototype,"drawCrosshair",function(a,b,c){var d,e;a.call(this,b,c);if(v(this.crosshair.label)&&this.crosshair.label.enabled){var a=this.chart,f=this.options.crosshair.label,g=this.horiz,h=this.opposite,i=this.left,j=this.top,k=this.crossLabel,l,m=f.format,n="",o=this.options.tickPosition===
"inside",r=this.crosshair.snap!==!1;l=g?"center":h?this.labelAlign==="right"?"right":"left":this.labelAlign==="left"?"left":"center";if(!k)k=this.crossLabel=a.renderer.label(null,null,null,f.shape||"callout").attr({align:f.align||l,zIndex:12,fill:f.backgroundColor||this.series[0]&&this.series[0].color||"gray",padding:q(f.padding,8),stroke:f.borderColor||"","stroke-width":f.borderWidth||0,r:q(f.borderRadius,3)}).css(A({color:"white",fontWeight:"normal",fontSize:"11px",textAlign:"center"},f.style)).add();
g?(l=r?c.plotX+i:b.chartX,j+=h?0:this.height):(l=h?this.width+i:0,j=r?c.plotY+j:b.chartY);!m&&!f.formatter&&(this.isDatetimeAxis&&(n="%b %d, %Y"),m="{value"+(n?":"+n:"")+"}");b=r?c[this.isXAxis?"x":"y"]:this.toValue(g?b.chartX:b.chartY);k.attr({text:m?La(m,{value:b}):f.formatter.call(this,b),anchorX:g?l:this.opposite?0:a.chartWidth,anchorY:g?this.opposite?a.chartHeight:0:j,x:l,y:j,visibility:"visible"});b=k.getBBox();if(g){if(o&&!h||!o&&h)j=k.y-b.height}else j=k.y-b.height/2;g?(d=i-b.x,e=i+this.width-
b.x):(d=this.labelAlign==="left"?i:0,e=this.labelAlign==="right"?i+this.width:a.chartWidth);k.translateX<d&&(l+=d-k.translateX);k.translateX+b.width>=e&&(l-=k.translateX+b.width-e);k.attr({x:l,y:j,visibility:"visible"})}});var gc=ia.init,hc=ia.processData,ic=Ha.prototype.tooltipFormatter;ia.init=function(){gc.apply(this,arguments);this.setCompare(this.options.compare)};ia.setCompare=function(a){this.modifyValue=a==="value"||a==="percent"?function(b,c){var d=this.compareValue;if(b!==t&&(b=a==="value"?
b-d:b=100*(b/d)-100,c))c.change=b;return b}:null;if(this.chart.hasRendered)this.isDirty=!0};ia.processData=function(){var a,b=-1,c,d,e,f;hc.apply(this,arguments);if(this.xAxis&&this.processedYData){c=this.processedXData;d=this.processedYData;e=d.length;this.pointArrayMap&&(b=sa(this.pointValKey||"y",this.pointArrayMap));for(a=0;a<e;a++)if(f=b>-1?d[a][b]:d[a],C(f)&&c[a]>=this.xAxis.min&&f!==0){this.compareValue=f;break}}};U(ia,"getExtremes",function(a){var b;a.apply(this,[].slice.call(arguments,1));
if(this.modifyValue)b=[this.modifyValue(this.dataMin),this.modifyValue(this.dataMax)],this.dataMin=Ma(b),this.dataMax=Da(b)});J.prototype.setCompare=function(a,b){this.isXAxis||(o(this.series,function(b){b.setCompare(a)}),q(b,!0)&&this.chart.redraw())};Ha.prototype.tooltipFormatter=function(a){a=a.replace("{point.change}",(this.change>0?"+":"")+B.numberFormat(this.change,q(this.series.tooltipOptions.changeDecimals,2)));return ic.apply(this,[a])};U(P.prototype,"render",function(a){if(this.chart.options._stock&&
this.xAxis)!this.clipBox&&this.animate?(this.clipBox=z(this.chart.clipBox),this.clipBox.width=this.xAxis.len,this.clipBox.height=this.yAxis.len):this.chart[this.sharedClipKey]&&(Sa(this.chart[this.sharedClipKey]),this.chart[this.sharedClipKey].attr({width:this.xAxis.len,height:this.yAxis.len}));a.call(this)});A(B,{Color:va,Point:Ha,Tick:bb,Renderer:Xa,SVGElement:Z,SVGRenderer:xa,arrayMin:Ma,arrayMax:Da,charts:$,correctFloat:ka,dateFormat:na,error:ga,format:La,pathAnim:void 0,getOptions:function(){return R},
hasBidiBug:Zb,isTouchDevice:jb,setOptions:function(a){R=z(!0,R,a);Ob();return R},addEvent:E,removeEvent:T,createElement:fa,discardElement:Ua,css:N,each:o,map:ta,merge:z,splat:ua,stableSort:nb,extendClass:ma,pInt:K,svg:ja,canvas:qa,vml:!ja&&!qa,product:"Highstock",version:"4.2.5"});return B});
;
/*
 Highstock JS v4.2.5 (2016-05-06)
 Data module

 (c) 2012-2016 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(g){typeof module==="object"&&module.exports?module.exports=g:g(Highcharts)})(function(g){var u=g.win.document,j=g.each,v=g.pick,r=g.inArray,s=g.isNumber,w=g.splat,k,p=function(b,a){this.init(b,a)};g.extend(p.prototype,{init:function(b,a){this.options=b;this.chartOptions=a;this.columns=b.columns||this.rowsToColumns(b.rows)||[];this.firstRowAsNames=v(b.firstRowAsNames,!0);this.decimalRegex=b.decimalPoint&&RegExp("^(-?[0-9]+)"+b.decimalPoint+"([0-9]+)$");this.rawColumns=[];this.columns.length?
this.dataFound():(this.parseCSV(),this.parseTable(),this.parseGoogleSpreadsheet())},getColumnDistribution:function(){var b=this.chartOptions,a=this.options,e=[],f=function(b){return(g.seriesTypes[b||"line"].prototype.pointArrayMap||[0]).length},d=b&&b.chart&&b.chart.type,c=[],h=[],q=0,i;j(b&&b.series||[],function(b){c.push(f(b.type||d))});j(a&&a.seriesMapping||[],function(b){e.push(b.x||0)});e.length===0&&e.push(0);j(a&&a.seriesMapping||[],function(a){var e=new k,o,n=c[q]||f(d),m=g.seriesTypes[((b&&
b.series||[])[q]||{}).type||d||"line"].prototype.pointArrayMap||["y"];e.addColumnReader(a.x,"x");for(o in a)a.hasOwnProperty(o)&&o!=="x"&&e.addColumnReader(a[o],o);for(i=0;i<n;i++)e.hasReader(m[i])||e.addColumnReader(void 0,m[i]);h.push(e);q++});a=g.seriesTypes[d||"line"].prototype.pointArrayMap;a===void 0&&(a=["y"]);this.valueCount={global:f(d),xColumns:e,individual:c,seriesBuilders:h,globalPointArrayMap:a}},dataFound:function(){if(this.options.switchRowsAndColumns)this.columns=this.rowsToColumns(this.columns);
this.getColumnDistribution();this.parseTypes();this.parsed()!==!1&&this.complete()},parseCSV:function(){var b=this,a=this.options,e=a.csv,f=this.columns,d=a.startRow||0,c=a.endRow||Number.MAX_VALUE,h=a.startColumn||0,q=a.endColumn||Number.MAX_VALUE,i,g,t=0;e&&(g=e.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split(a.lineDelimiter||"\n"),i=a.itemDelimiter||(e.indexOf("\t")!==-1?"\t":","),j(g,function(a,e){var g=b.trim(a),x=g.indexOf("#")===0;e>=d&&e<=c&&!x&&g!==""&&(g=a.split(i),j(g,function(b,a){a>=
h&&a<=q&&(f[a-h]||(f[a-h]=[]),f[a-h][t]=b)}),t+=1)}),this.dataFound())},parseTable:function(){var b=this.options,a=b.table,e=this.columns,f=b.startRow||0,d=b.endRow||Number.MAX_VALUE,c=b.startColumn||0,h=b.endColumn||Number.MAX_VALUE;a&&(typeof a==="string"&&(a=u.getElementById(a)),j(a.getElementsByTagName("tr"),function(b,a){a>=f&&a<=d&&j(b.children,function(b,d){if((b.tagName==="TD"||b.tagName==="TH")&&d>=c&&d<=h)e[d-c]||(e[d-c]=[]),e[d-c][a-f]=b.innerHTML})}),this.dataFound())},parseGoogleSpreadsheet:function(){var b=
this,a=this.options,e=a.googleSpreadsheetKey,f=this.columns,d=a.startRow||0,c=a.endRow||Number.MAX_VALUE,h=a.startColumn||0,g=a.endColumn||Number.MAX_VALUE,i,j;e&&jQuery.ajax({dataType:"json",url:"https://spreadsheets.google.com/feeds/cells/"+e+"/"+(a.googleSpreadsheetWorksheet||"od6")+"/public/values?alt=json-in-script&callback=?",error:a.error,success:function(a){var a=a.feed.entry,e,n=a.length,m=0,k=0,l;for(l=0;l<n;l++)e=a[l],m=Math.max(m,e.gs$cell.col),k=Math.max(k,e.gs$cell.row);for(l=0;l<m;l++)if(l>=
h&&l<=g)f[l-h]=[],f[l-h].length=Math.min(k,c-d);for(l=0;l<n;l++)if(e=a[l],i=e.gs$cell.row-1,j=e.gs$cell.col-1,j>=h&&j<=g&&i>=d&&i<=c)f[j-h][i-d]=e.content.$t;b.dataFound()}})},trim:function(b,a){typeof b==="string"&&(b=b.replace(/^\s+|\s+$/g,""),a&&/^[0-9\s]+$/.test(b)&&(b=b.replace(/\s/g,"")),this.decimalRegex&&(b=b.replace(this.decimalRegex,"$1.$2")));return b},parseTypes:function(){for(var b=this.columns,a=b.length;a--;)this.parseColumn(b[a],a)},parseColumn:function(b,a){var e=this.rawColumns,
f=this.columns,d=b.length,c,h,g,i,j=this.firstRowAsNames,k=r(a,this.valueCount.xColumns)!==-1,o=[],n=this.chartOptions,m,p=(this.options.columnTypes||[])[a],n=k&&(n&&n.xAxis&&w(n.xAxis)[0].type==="category"||p==="string");for(e[a]||(e[a]=[]);d--;)if(c=o[d]||b[d],g=this.trim(c),i=this.trim(c,!0),h=parseFloat(i),e[a][d]===void 0&&(e[a][d]=g),n||d===0&&j)b[d]=g;else if(+i===h)b[d]=h,h>31536E6&&p!=="float"?b.isDatetime=!0:b.isNumeric=!0,b[d+1]!==void 0&&(m=h>b[d+1]);else if(h=this.parseDate(c),k&&s(h)&&
p!=="float"){if(o[d]=c,b[d]=h,b.isDatetime=!0,b[d+1]!==void 0){c=h>b[d+1];if(c!==m&&m!==void 0)this.alternativeFormat?(this.dateFormat=this.alternativeFormat,d=b.length,this.alternativeFormat=this.dateFormats[this.dateFormat].alternative):b.unsorted=!0;m=c}}else if(b[d]=g===""?null:g,d!==0&&(b.isDatetime||b.isNumeric))b.mixed=!0;k&&b.mixed&&(f[a]=e[a]);if(k&&m&&this.options.sort)for(a=0;a<f.length;a++)f[a].reverse(),j&&f[a].unshift(f[a].pop())},dateFormats:{"YYYY-mm-dd":{regex:/^([0-9]{4})[\-\/\.]([0-9]{2})[\-\/\.]([0-9]{2})$/,
parser:function(b){return Date.UTC(+b[1],b[2]-1,+b[3])}},"dd/mm/YYYY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,parser:function(b){return Date.UTC(+b[3],b[2]-1,+b[1])},alternative:"mm/dd/YYYY"},"mm/dd/YYYY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,parser:function(b){return Date.UTC(+b[3],b[1]-1,+b[2])}},"dd/mm/YY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,parser:function(b){return Date.UTC(+b[3]+2E3,b[2]-1,+b[1])},alternative:"mm/dd/YY"},
"mm/dd/YY":{regex:/^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,parser:function(b){return Date.UTC(+b[3]+2E3,b[1]-1,+b[2])}}},parseDate:function(b){var a=this.options.parseDate,e,f,d=this.options.dateFormat||this.dateFormat,c;if(a)e=a(b);else if(typeof b==="string"){if(d)a=this.dateFormats[d],(c=b.match(a.regex))&&(e=a.parser(c));else for(f in this.dateFormats)if(a=this.dateFormats[f],c=b.match(a.regex)){this.dateFormat=f;this.alternativeFormat=a.alternative;e=a.parser(c);break}c||(c=Date.parse(b),
typeof c==="object"&&c!==null&&c.getTime?e=c.getTime()-c.getTimezoneOffset()*6E4:s(c)&&(e=c-(new Date(c)).getTimezoneOffset()*6E4))}return e},rowsToColumns:function(b){var a,e,f,d,c;if(b){c=[];e=b.length;for(a=0;a<e;a++){d=b[a].length;for(f=0;f<d;f++)c[f]||(c[f]=[]),c[f][a]=b[a][f]}}return c},parsed:function(){if(this.options.parsed)return this.options.parsed.call(this,this.columns)},getFreeIndexes:function(b,a){var e,f,d=[],c=[],h;for(f=0;f<b;f+=1)d.push(!0);for(e=0;e<a.length;e+=1){h=a[e].getReferencedColumnIndexes();
for(f=0;f<h.length;f+=1)d[h[f]]=!1}for(f=0;f<d.length;f+=1)d[f]&&c.push(f);return c},complete:function(){var b=this.columns,a,e=this.options,f,d,c,h,g=[],i;if(e.complete||e.afterComplete){for(c=0;c<b.length;c++)if(this.firstRowAsNames)b[c].name=b[c].shift();f=[];d=this.getFreeIndexes(b.length,this.valueCount.seriesBuilders);for(c=0;c<this.valueCount.seriesBuilders.length;c++)i=this.valueCount.seriesBuilders[c],i.populateColumns(d)&&g.push(i);for(;d.length>0;){i=new k;i.addColumnReader(0,"x");c=r(0,
d);c!==-1&&d.splice(c,1);for(c=0;c<this.valueCount.global;c++)i.addColumnReader(void 0,this.valueCount.globalPointArrayMap[c]);i.populateColumns(d)&&g.push(i)}g.length>0&&g[0].readers.length>0&&(i=b[g[0].readers[0].columnIndex],i!==void 0&&(i.isDatetime?a="datetime":i.isNumeric||(a="category")));if(a==="category")for(c=0;c<g.length;c++){i=g[c];for(d=0;d<i.readers.length;d++)if(i.readers[d].configName==="x")i.readers[d].configName="name"}for(c=0;c<g.length;c++){i=g[c];d=[];for(h=0;h<b[0].length;h++)d[h]=
i.read(b,h);f[c]={data:d};if(i.name)f[c].name=i.name;if(a==="category")f[c].turboThreshold=0}b={series:f};if(a)b.xAxis={type:a};e.complete&&e.complete(b);e.afterComplete&&e.afterComplete(b)}}});g.Data=p;g.data=function(b,a){return new p(b,a)};g.wrap(g.Chart.prototype,"init",function(b,a,e){var f=this;a&&a.data?g.data(g.extend(a.data,{afterComplete:function(d){var c,h;if(a.hasOwnProperty("series"))if(typeof a.series==="object")for(c=Math.max(a.series.length,d.series.length);c--;)h=a.series[c]||{},
a.series[c]=g.merge(h,d.series[c]);else delete a.series;a=g.merge(d,a);b.call(f,a,e)}}),a):b.call(f,a,e)});k=function(){this.readers=[];this.pointIsArray=!0};k.prototype.populateColumns=function(b){var a=!0;j(this.readers,function(a){if(a.columnIndex===void 0)a.columnIndex=b.shift()});j(this.readers,function(b){b.columnIndex===void 0&&(a=!1)});return a};k.prototype.read=function(b,a){var e=this.pointIsArray,f=e?[]:{},d;j(this.readers,function(c){var d=b[c.columnIndex][a];e?f.push(d):f[c.configName]=
d});if(this.name===void 0&&this.readers.length>=2&&(d=this.getReferencedColumnIndexes(),d.length>=2))d.shift(),d.sort(),this.name=b[d.shift()].name;return f};k.prototype.addColumnReader=function(b,a){this.readers.push({columnIndex:b,configName:a});if(!(a==="x"||a==="y"||a===void 0))this.pointIsArray=!1};k.prototype.getReferencedColumnIndexes=function(){var b,a=[],e;for(b=0;b<this.readers.length;b+=1)e=this.readers[b],e.columnIndex!==void 0&&a.push(e.columnIndex);return a};k.prototype.hasReader=function(b){var a,
e;for(a=0;a<this.readers.length;a+=1)if(e=this.readers[a],e.configName===b)return!0}});
;
/*
 Highstock JS v4.2.5 (2016-05-06)
 Exporting module

 (c) 2010-2016 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(f){typeof module==="object"&&module.exports?module.exports=f:f(Highcharts)})(function(f){var t=f.win,k=t.document,C=f.Chart,v=f.addEvent,D=f.removeEvent,E=f.fireEvent,s=f.createElement,u=f.discardElement,x=f.css,l=f.merge,q=f.each,r=f.extend,F=f.splat,G=Math.max,H=f.isTouchDevice,I=f.Renderer.prototype.symbols,A=f.getOptions(),B;r(A.lang,{printChart:"Print chart",downloadPNG:"Download PNG image",downloadJPEG:"Download JPEG image",downloadPDF:"Download PDF document",downloadSVG:"Download SVG vector image",
contextButtonTitle:"Chart context menu"});A.navigation={menuStyle:{border:"1px solid #A0A0A0",background:"#FFFFFF",padding:"5px 0"},menuItemStyle:{padding:"0 10px",background:"none",color:"#303030",fontSize:H?"14px":"11px"},menuItemHoverStyle:{background:"#4572A5",color:"#FFFFFF"},buttonOptions:{symbolFill:"#E0E0E0",symbolSize:14,symbolStroke:"#666",symbolStrokeWidth:3,symbolX:12.5,symbolY:10.5,align:"right",buttonSpacing:3,height:22,theme:{fill:"white",stroke:"none"},verticalAlign:"top",width:24}};
A.exporting={type:"image/png",url:"https://export.highcharts.com/",printMaxWidth:780,buttons:{contextButton:{menuClassName:"highcharts-contextmenu",symbol:"menu",_titleKey:"contextButtonTitle",menuItems:[{textKey:"printChart",onclick:function(){this.print()}},{separator:!0},{textKey:"downloadPNG",onclick:function(){this.exportChart()}},{textKey:"downloadJPEG",onclick:function(){this.exportChart({type:"image/jpeg"})}},{textKey:"downloadPDF",onclick:function(){this.exportChart({type:"application/pdf"})}},
{textKey:"downloadSVG",onclick:function(){this.exportChart({type:"image/svg+xml"})}}]}}};f.post=function(a,b,e){var c,a=s("form",l({method:"post",action:a,enctype:"multipart/form-data"},e),{display:"none"},k.body);for(c in b)s("input",{type:"hidden",name:c,value:b[c]},null,a);a.submit();u(a)};r(C.prototype,{sanitizeSVG:function(a){return a.replace(/zIndex="[^"]+"/g,"").replace(/isShadow="[^"]+"/g,"").replace(/symbolName="[^"]+"/g,"").replace(/jQuery[0-9]+="[^"]+"/g,"").replace(/url\([^#]+#/g,"url(#").replace(/<svg /,
'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ').replace(/ (NS[0-9]+\:)?href=/g," xlink:href=").replace(/\n/," ").replace(/<\/svg>.*?$/,"</svg>").replace(/(fill|stroke)="rgba\(([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)\)"/g,'$1="rgb($2)" $1-opacity="$3"').replace(/&nbsp;/g,"\u00a0").replace(/&shy;/g,"\u00ad").replace(/<IMG /g,"<image ").replace(/<(\/?)TITLE>/g,"<$1title>").replace(/height=([^" ]+)/g,'height="$1"').replace(/width=([^" ]+)/g,'width="$1"').replace(/hc-svg-href="([^"]+)">/g,'xlink:href="$1"/>').replace(/ id=([^" >]+)/g,
' id="$1"').replace(/class=([^" >]+)/g,'class="$1"').replace(/ transform /g," ").replace(/:(path|rect)/g,"$1").replace(/style="([^"]+)"/g,function(a){return a.toLowerCase()})},getChartHTML:function(){return this.container.innerHTML},getSVG:function(a){var b=this,e,c,g,j,h,d=l(b.options,a),m=d.exporting.allowHTML;if(!k.createElementNS)k.createElementNS=function(a,b){return k.createElement(b)};c=s("div",null,{position:"absolute",top:"-9999em",width:b.chartWidth+"px",height:b.chartHeight+"px"},k.body);
g=b.renderTo.style.width;h=b.renderTo.style.height;g=d.exporting.sourceWidth||d.chart.width||/px$/.test(g)&&parseInt(g,10)||600;h=d.exporting.sourceHeight||d.chart.height||/px$/.test(h)&&parseInt(h,10)||400;r(d.chart,{animation:!1,renderTo:c,forExport:!0,renderer:"SVGRenderer",width:g,height:h});d.exporting.enabled=!1;delete d.data;d.series=[];q(b.series,function(a){j=l(a.userOptions,{animation:!1,enableMouseTracking:!1,showCheckbox:!1,visible:a.visible});j.isInternal||d.series.push(j)});a&&q(["xAxis",
"yAxis"],function(b){q(F(a[b]),function(a,c){d[b][c]=l(d[b][c],a)})});e=new f.Chart(d,b.callback);q(["xAxis","yAxis"],function(a){q(b[a],function(b,c){var d=e[a][c],f=b.getExtremes(),g=f.userMin,f=f.userMax;d&&(g!==void 0||f!==void 0)&&d.setExtremes(g,f,!0,!1)})});g=e.getChartHTML();d=null;e.destroy();u(c);if(m&&(c=g.match(/<\/svg>(.*?$)/)))c='<foreignObject x="0" y="0" width="200" height="200"><body xmlns="http://www.w3.org/1999/xhtml">'+c[1]+"</body></foreignObject>",g=g.replace("</svg>",c+"</svg>");
g=this.sanitizeSVG(g);return g=g.replace(/(url\(#highcharts-[0-9]+)&quot;/g,"$1").replace(/&quot;/g,"'")},getSVGForExport:function(a,b){var e=this.options.exporting;return this.getSVG(l({chart:{borderRadius:0}},e.chartOptions,b,{exporting:{sourceWidth:a&&a.sourceWidth||e.sourceWidth,sourceHeight:a&&a.sourceHeight||e.sourceHeight}}))},exportChart:function(a,b){var e=this.getSVGForExport(a,b),a=l(this.options.exporting,a);f.post(a.url,{filename:a.filename||"chart",type:a.type,width:a.width||0,scale:a.scale||
2,svg:e},a.formAttributes)},print:function(){var a=this,b=a.container,e=[],c=b.parentNode,f=k.body,j=f.childNodes,h=a.options.exporting.printMaxWidth,d,m,n;if(!a.isPrinting){a.isPrinting=!0;a.pointer.reset(null,0);E(a,"beforePrint");if(n=h&&a.chartWidth>h)d=a.hasUserSize,m=[a.chartWidth,a.chartHeight,!1],a.setSize(h,a.chartHeight,!1);q(j,function(a,b){if(a.nodeType===1)e[b]=a.style.display,a.style.display="none"});f.appendChild(b);t.focus();t.print();setTimeout(function(){c.appendChild(b);q(j,function(a,
b){if(a.nodeType===1)a.style.display=e[b]});a.isPrinting=!1;if(n)a.setSize.apply(a,m),a.hasUserSize=d;E(a,"afterPrint")},1E3)}},contextMenu:function(a,b,e,c,f,j,h){var d=this,m=d.options.navigation,n=m.menuItemStyle,o=d.chartWidth,p=d.chartHeight,l="cache-"+a,i=d[l],w=G(f,j),y,z,t,u=function(b){d.pointer.inClass(b.target,a)||z()};if(!i)d[l]=i=s("div",{className:a},{position:"absolute",zIndex:1E3,padding:w+"px"},d.container),y=s("div",null,r({MozBoxShadow:"3px 3px 10px #888",WebkitBoxShadow:"3px 3px 10px #888",
boxShadow:"3px 3px 10px #888"},m.menuStyle),i),z=function(){x(i,{display:"none"});h&&h.setState(0);d.openMenu=!1},v(i,"mouseleave",function(){t=setTimeout(z,500)}),v(i,"mouseenter",function(){clearTimeout(t)}),v(k,"mouseup",u),v(d,"destroy",function(){D(k,"mouseup",u)}),q(b,function(a){if(a){var b=a.separator?s("hr",null,null,y):s("div",{onmouseover:function(){x(this,m.menuItemHoverStyle)},onmouseout:function(){x(this,n)},onclick:function(b){b&&b.stopPropagation();z();a.onclick&&a.onclick.apply(d,
arguments)},innerHTML:a.text||d.options.lang[a.textKey]},r({cursor:"pointer"},n),y);d.exportDivElements.push(b)}}),d.exportDivElements.push(y,i),d.exportMenuWidth=i.offsetWidth,d.exportMenuHeight=i.offsetHeight;b={display:"block"};e+d.exportMenuWidth>o?b.right=o-e-f-w+"px":b.left=e-w+"px";c+j+d.exportMenuHeight>p&&h.alignOptions.verticalAlign!=="top"?b.bottom=p-c-w+"px":b.top=c+j-w+"px";x(i,b);d.openMenu=!0},addButton:function(a){var b=this,e=b.renderer,c=l(b.options.navigation.buttonOptions,a),g=
c.onclick,j=c.menuItems,h,d,m={stroke:c.symbolStroke,fill:c.symbolFill},n=c.symbolSize||12;if(!b.btnCount)b.btnCount=0;if(!b.exportDivElements)b.exportDivElements=[],b.exportSVGElements=[];if(c.enabled!==!1){var o=c.theme,p=o.states,k=p&&p.hover,p=p&&p.select,i;delete o.states;g?i=function(a){a.stopPropagation();g.call(b,a)}:j&&(i=function(){b.contextMenu(d.menuClassName,j,d.translateX,d.translateY,d.width,d.height,d);d.setState(2)});c.text&&c.symbol?o.paddingLeft=f.pick(o.paddingLeft,25):c.text||
r(o,{width:c.width,height:c.height,padding:0});d=e.button(c.text,0,0,i,o,k,p).attr({title:b.options.lang[c._titleKey],"stroke-linecap":"round",zIndex:3});d.menuClassName=a.menuClassName||"highcharts-menu-"+b.btnCount++;c.symbol&&(h=e.symbol(c.symbol,c.symbolX-n/2,c.symbolY-n/2,n,n).attr(r(m,{"stroke-width":c.symbolStrokeWidth||1,zIndex:1})).add(d));d.add().align(r(c,{width:d.width,x:f.pick(c.x,B)}),!0,"spacingBox");B+=(d.width+c.buttonSpacing)*(c.align==="right"?-1:1);b.exportSVGElements.push(d,h)}},
destroyExport:function(a){var a=a.target,b,e;for(b=0;b<a.exportSVGElements.length;b++)if(e=a.exportSVGElements[b])e.onclick=e.ontouchstart=null,a.exportSVGElements[b]=e.destroy();for(b=0;b<a.exportDivElements.length;b++)e=a.exportDivElements[b],D(e,"mouseleave"),a.exportDivElements[b]=e.onmouseout=e.onmouseover=e.ontouchstart=e.onclick=null,u(e)}});I.menu=function(a,b,e,c){return["M",a,b+2.5,"L",a+e,b+2.5,"M",a,b+c/2+0.5,"L",a+e,b+c/2+0.5,"M",a,b+c-1.5,"L",a+e,b+c-1.5]};C.prototype.callbacks.push(function(a){var b,
e=a.options.exporting,c=e.buttons;B=0;if(e.enabled!==!1){for(b in c)a.addButton(c[b]);v(a,"destroy",a.destroyExport)}})});
;
/**
 * A Highcharts plugin for exporting data from a rendered chart as CSV, XLS or HTML table
 *
 * Author:   Torstein Honsi
 * Licence:  MIT
 * Version:  1.4.2
 */
/*global Highcharts, window, document, Blob */
(function (factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
})(function (Highcharts) {

    'use strict';

    var each = Highcharts.each,
        pick = Highcharts.pick,
        seriesTypes = Highcharts.seriesTypes,
        downloadAttrSupported = document.createElement('a').download !== undefined;

    Highcharts.setOptions({
        lang: {
            downloadCSV: 'Download CSV',
            downloadXLS: 'Download XLS',
            viewData: 'View data table'
        }
    });


    /**
     * Get the data rows as a two dimensional array
     */
    Highcharts.Chart.prototype.getDataRows = function () {
        var options = (this.options.exporting || {}).csv || {},
            xAxis = this.xAxis[0],
            rows = {},
            rowArr = [],
            dataRows,
            names = [],
            i,
            x,
            xTitle = xAxis.options.title && xAxis.options.title.text,

            // Options
            dateFormat = options.dateFormat || '%Y-%m-%d %H:%M:%S',
            columnHeaderFormatter = options.columnHeaderFormatter || function (series, key, keyLength) {
                return series.name + (keyLength > 1 ? ' ('+ key + ')' : '');
            };

        // Loop the series and index values
        i = 0;
        each(this.series, function (series) {
            var keys = series.options.keys,
                pointArrayMap = keys || series.pointArrayMap || ['y'],
                valueCount = pointArrayMap.length,
                requireSorting = series.requireSorting,
                categoryMap = {},
                j;

            // Map the categories for value axes
            each(pointArrayMap, function (prop) {
                categoryMap[prop] = (series[prop + 'Axis'] && series[prop + 'Axis'].categories) || [];
            });

            if (series.options.includeInCSVExport !== false && series.visible !== false) { // #55
                j = 0;
                while (j < valueCount) {
                    names.push(columnHeaderFormatter(series, pointArrayMap[j], pointArrayMap.length));
                    j = j + 1;
                }

                each(series.points, function (point, pIdx) {
                    var key = requireSorting ? point.x : pIdx,
                        prop,
                        val;

                    j = 0;

                    if (!rows[key]) {
                        rows[key] = [];
                    }
                    rows[key].x = point.x;

                    // Pies, funnels, geo maps etc. use point name in X row
                    if (!series.xAxis || series.exportKey === 'name') {
                        rows[key].name = point.name;
                    }

                    while (j < valueCount) {
                        prop = pointArrayMap[j]; // y, z etc
                        val = point[prop];
                        rows[key][i + j] = pick(categoryMap[prop][val], val); // Pick a Y axis category if present
                        j = j + 1;
                    }

                });
                i = i + j;
            }
        });

        // Make a sortable array
        for (x in rows) {
            if (rows.hasOwnProperty(x)) {
                rowArr.push(rows[x]);
            }
        }
        // Sort it by X values
        rowArr.sort(function (a, b) {
            return a.x - b.x;
        });

        // Add header row
        if (!xTitle) {
            xTitle = xAxis.isDatetimeAxis ? 'DateTime' : 'Category';
        }
        dataRows = [[xTitle].concat(names)];

        // Add the category column
        each(rowArr, function (row) {

            var category = row.name;
            if (!category) {
                if (xAxis.isDatetimeAxis) {
                    if (row.x instanceof Date) {
                        row.x = row.x.getTime();
                    }
                    category = Highcharts.dateFormat(dateFormat, row.x);
                } else if (xAxis.categories) {
                    category = pick(xAxis.names[row.x], xAxis.categories[row.x], row.x)
                } else {
                    category = row.x;
                }
            }

            // Add the X/date/category
            row.unshift(category);
            dataRows.push(row);
        });

        return dataRows;
    };

    /**
     * Get a CSV string
     */
    Highcharts.Chart.prototype.getCSV = function (useLocalDecimalPoint) {
        var csv = '',
            rows = this.getDataRows(),
            options = (this.options.exporting || {}).csv || {},
            itemDelimiter = options.itemDelimiter || ',', // use ';' for direct import to Excel
            lineDelimiter = options.lineDelimiter || '\n'; // '\n' isn't working with the js csv data extraction

        // Transform the rows to CSV
        each(rows, function (row, i) {
            var val = '',
                j = row.length,
                n = useLocalDecimalPoint ? (1.1).toLocaleString()[1] : '.';
            while (j--) {
                val = row[j];
                if (typeof val === "string") {
                    val = '"' + val + '"';
                }
                if (typeof val === 'number') {
                    if (n === ',') {
                        val = val.toString().replace(".", ",");
                    }
                }
                row[j] = val;
            }
            // Add the values
            csv += row.join(itemDelimiter);

            // Add the line delimiter
            if (i < rows.length - 1) {
                csv += lineDelimiter;
            }
        });
        return csv;
    };

    /**
     * Build a HTML table with the data
     */
    Highcharts.Chart.prototype.getTable = function (useLocalDecimalPoint) {
        var html = '<table>',
            rows = this.getDataRows();

        // Transform the rows to HTML
        each(rows, function (row, i) {
            var tag = i ? 'td' : 'th',
                val,
                j,
                n = useLocalDecimalPoint ? (1.1).toLocaleString()[1] : '.';

            html += '<tr>';
            for (j = 0; j < row.length; j = j + 1) {
                val = row[j];
                // Add the cell
                if (typeof val === 'number') {
                    val = val.toString();
                    if (n === ',') {
                        val = val.replace('.', n);
                    }
                    html += '<' + tag + ' class="number">' + val + '</' + tag + '>';

                } else {
                    html += '<' + tag + '>' + (val === undefined ? '' : val) + '</' + tag + '>';
                }
            }

            html += '</tr>';
        });
        html += '</table>';
        return html;
    };

    function getContent(chart, href, extension, content, MIME) {
        var a,
            blobObject,
            name,
            options = (chart.options.exporting || {}).csv || {},
            url = options.url || 'http://www.highcharts.com/studies/csv-export/download.php';

        if (chart.options.exporting.filename) {
            name = chart.options.exporting.filename;
        } else if (chart.title) {
            name = chart.title.textStr.replace(/ /g, '-').toLowerCase();
        } else {
            name = 'chart';
        }

        // MS specific. Check this first because of bug with Edge (#76)
        if (window.Blob && window.navigator.msSaveOrOpenBlob) {
            // Falls to msSaveOrOpenBlob if download attribute is not supported
            blobObject = new Blob([content]);
            window.navigator.msSaveOrOpenBlob(blobObject, name + '.' + extension);

        // Download attribute supported
        } else if (downloadAttrSupported) {
            a = document.createElement('a');
            a.href = href;
            a.target = '_blank';
            a.download = name + '.' + extension;
            document.body.appendChild(a);
            a.click();
            a.remove();

        } else {
            // Fall back to server side handling
            Highcharts.post(url, {
                data: content,
                type: MIME,
                extension: extension
            });
        }
    }

    /**
     * Call this on click of 'Download CSV' button
     */
    Highcharts.Chart.prototype.downloadCSV = function () {
        var csv = this.getCSV(true);
        getContent(
            this,
            'data:text/csv,\uFEFF' + csv.replace(/\n/g, '%0A'),
            'csv',
            csv,
            'text/csv'
        );
    };

    /**
     * Call this on click of 'Download XLS' button
     */
    Highcharts.Chart.prototype.downloadXLS = function () {
        var uri = 'data:application/vnd.ms-excel;base64,',
            template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
                '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
                '<x:Name>Ark1</x:Name>' +
                '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
                '<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";}</style>' +
                '<meta name=ProgId content=Excel.Sheet>' +
                '<meta charset=UTF-8>' +
                '</head><body>' +
                this.getTable(true) +
                '</body></html>',
            base64 = function (s) { 
                return window.btoa(unescape(encodeURIComponent(s))); // #50
            };
        getContent(
            this,
            uri + base64(template),
            'xls',
            template,
            'application/vnd.ms-excel'
        );
    };

    /**
     * View the data in a table below the chart
     */
    Highcharts.Chart.prototype.viewData = function () {
        if (!this.insertedTable) {
            var div = document.createElement('div');
            div.className = 'highcharts-data-table';
            // Insert after the chart container
            this.renderTo.parentNode.insertBefore(div, this.renderTo.nextSibling);
            div.innerHTML = this.getTable();
            this.insertedTable = true;
        }
    };


    // Add "Download CSV" to the exporting menu. Use download attribute if supported, else
    // run a simple PHP script that returns a file. The source code for the PHP script can be viewed at
    // https://raw.github.com/highslide-software/highcharts.com/master/studies/csv-export/csv.php
    if (Highcharts.getOptions().exporting) {
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.push({
            textKey: 'downloadCSV',
            onclick: function () { this.downloadCSV(); }
        }, {
            textKey: 'downloadXLS',
            onclick: function () { this.downloadXLS(); }
        }, {
            textKey: 'viewData',
            onclick: function () { this.viewData(); }
        });
    }

    // Series specific
    if (seriesTypes.map) {
        seriesTypes.map.prototype.exportKey = 'name';
    }
    if (seriesTypes.mapbubble) {
        seriesTypes.mapbubble.prototype.exportKey = 'name';
    }

});

// Script for SVG pan and zoom - additional js in etrends.js 
	
	//Create object on window for seasonal svg map  
	  var seasonalSVGpm25map = {};
	  seasonalSVGpm25map.svgID = "svgSeasonalPm25map";
	  seasonalSVGpm25map.panZoom;
	  
	//To know when map is initially loaded to set window resize events
	seasonalSVGpm25map.isLoaded=false;
	
	//Handle SVG DropDown Change - updated to a toggle checkbox
	seasonalSVGpm25map.onDropChange = function  (folder,newsvg){
		if (seasonalSVGpm25map.panZoom) seasonalSVGpm25map.panZoom.destroy(); 
		seasonalSVGpm25map.panZoom = null;
			document.getElementById(seasonalSVGpm25map.svgID).data= folder + "/" + newsvg + ".svg";		
	};

	//Custom Event Handler
	seasonalSVGpm25map.eventsHandler = {
        haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel']
        , init: function(options) {
            var instance = options.instance
              , initialScale = 1
              , pannedX = 0
              , pannedY = 0

            // Init Hammer
            // Listen only for pointer and touch events
            this.hammer = Hammer(options.svgElement, {
              inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
            })

            // Enable pinch
            this.hammer.get('pinch').set({enable: true})

            // Handle double tap
            this.hammer.on('doubletap', function(ev){
              instance.zoomIn()
            })

            // Handle pan
            this.hammer.on('panstart panmove', function(ev){
              // On pan start reset panned variables
              if (ev.type === 'panstart') {
                pannedX = 0
                pannedY = 0
              }

              // Pan only the difference
              instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY})
              pannedX = ev.deltaX
              pannedY = ev.deltaY
            })

            // Handle pinch
            this.hammer.on('pinchstart pinchmove', function(ev){
              // On pinch start remember initial zoom
              if (ev.type === 'pinchstart') {
                initialScale = instance.getZoom()
                instance.zoom(initialScale * ev.scale)
              }

              instance.zoom(initialScale * ev.scale)

            })

            // Prevent moving the page on some devices when panning over SVG
            options.svgElement.addEventListener('touchmove', function(e){ e.preventDefault(); });
        }

        , destroy: function(){
            this.hammer.destroy()
          }
    };

	seasonalSVGpm25map.beforePan = function(oldPan, newPan){
		var stopHorizontal = false
			, stopVertical = false
			, gutterWidth = 100
			, gutterHeight = 100
			  // Computed variables
			, sizes = this.getSizes()
			, leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
			, rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
			, topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
			, bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom)

		  customPan = {}
		  customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
		  customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))

		  return customPan
	};

	//Use a function to create svgPanZoom instance so it can be called when dropdown changes
	seasonalSVGpm25map.createSVGpanZoom	=	function () {
		if (seasonalSVGpm25map.panZoom) seasonalSVGpm25map.destroy(); 
				
		seasonalSVGpm25map.panZoom = svgPanZoom ('#' + seasonalSVGpm25map.svgID, {
			zoomEnabled: true,
			controlIconsEnabled: true,
			maxZoom: 3,
			fit: 1,
			center: 1,
			customEventsHandler: seasonalSVGpm25map.eventsHandler,
			beforePan: seasonalSVGpm25map.beforePan
		});
	};

	seasonalSVGpm25map.windowResizeHandler = function () {
		$(window).resize(function(){
			seasonalSVGpm25map.panZoom.resize();
			seasonalSVGpm25map.panZoom.fit();
			seasonalSVGpm25map.panZoom.center();
		});
	};    

	//when new svg is loaded create a new svgPanZoom instance
    $('#' + seasonalSVGpm25map.svgID).on('load', function () {
  		seasonalSVGpm25map.createSVGpanZoom();
        if (seasonalSVGpm25map.isLoaded===false) seasonalSVGpm25map.windowResizeHandler();
			seasonalSVGpm25map.isLoaded=true;
  	});

	window.onload = function() {
	//create initial svgPanZoom instance on svg on load handler now
	//  		seasonalSVGpm25map.createSVGpanZoom();
    };

		
// Script for Toxics map DropDown 
	
	function jsDropDown (imgid,folder,newimg){
		document.getElementById(imgid).src= folder + "/" + newimg + ".html";
	}
	
// bootstrap tooltips; used for Share button
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});
	
// Script for Effect Accordion 
	
	$('.collapse').on('shown.bs.collapse', function(){
		$(this).parent().find(".icon-hand-o-right").removeClass("icon-hand-o-right").addClass("icon-hand-o-down");
	}).on('hidden.bs.collapse', function(){
	$(this).parent().find(".icon-hand-o-down").removeClass("icon-hand-o-down").addClass("icon-hand-o-right");
	});
	
// fullpage initialization
$(function() {
		$('#fullpage').fullpage({
			//Scrolling
			autoScrolling: false,
			fitToSection: true,
			fitToSectionDelay: 1500,
			scrollBar: true,
			lockAnchors: true,
			normalScrollElements: '#report-nav, #naaqsMap, #svgSeasonalPm25map, #naaMap, #ozonesliderMap',
			//Navigation
			anchors: ['home_','welcome_','intro_','highlights_','air_pollution_','sources_','effects_','growth_','econ_growth_cleaner_air_','naaqs_','naaqs_trends_','composition_','unhealthy_aq_days_','nonattainment_','weather_','weather_influences_','visibility_','scenic_areas_','toxics_','toxics_trends_','outlook_','2025_projections_','summary_','resources_','social_media_'],
			navigation: true,
			navigationPosition: 'left',
			navigationTooltips:['Home','Welcome','Intro','Highlights','Air Pollution','Sources','Effects','Growth','Econ. Growth with Cleaner Air','NAAQS','NAAQS Trends','PM<sub>2.5</sub> Composition','Unhealthy AQI Days','Nonattainment','Weather','Weather Influences','Visibility','Scenic Areas','Toxics','Air Toxics','Outlook','2025','Summary','Resources','Social Media'],
			//Design 
			responsiveWidth: 1383,
			responsiveHeight: 900,
			sectionSelector: '.secFP'
		});
	});



/* Highcharts Dark Theme customized and charts */	
	
		$(function () {
			// Load the fonts
			

			Highcharts.theme = {
			   global: {
					canvasToolsURL: 'https://code.highcharts.com/4.2.5/modules/canvas-tools.js'
					},
				lang: {
					decimalPoint: '.',
					thousandsSep: ',',
					contextButtonTitle: "Print / Download",
					viewData: ''
					
				},
			   colors: ["#ff0066", "#7798BF", "#FFFF00", "#90ee7e", "#f45b5b", "#aaeeee", "#3366CC", "#eeaaee",
				  "#55BF3B", "#2b908f", "#996600", "#E0E0E3", "#DF5353", "#7798BF", "#aaeeee"],
			   chart: {
				  backgroundColor: '#2a2a2b',
				  style: {
					 fontFamily: "'Varela Round','Montserrat', 'Open Sans', sans-serif",
					 fontSize:'1em'
				  },
				  plotBorderColor: '#606063',
				  borderColor: '#707073',
				  borderWidth: 1,
				  borderRadius: 4,
			   },
			   title: {
				  style: {
					 color: '#E0E0E3',
					 textTransform: 'uppercase',
					 fontSize: '1.5em'
				  }
			   },
			   subtitle: {
				  style: {
					 color: '#E0E0E3',
					 textTransform: 'uppercase',
					 fontSize:'1.2em'
				  }
			   },
			   xAxis: {
				  gridLineColor: '#707073',
				  labels: {
					 style: {
						color: '#E0E0E3',
						fontSize: '.917em'
					 }
				  },
				  lineColor: '#707073',
				  minorGridLineColor: '#505053',
				  tickColor: '#707073',
				  title: {
					 style: {
						color: '#A0A0A3'
					 }
				  }
			   },
			   yAxis: {
				  gridLineColor: '#707073',
				  labels: {
					 style: {
						color: '#E0E0E3',
						fontSize:'.917em'
					 }
				  },
				  lineColor: '#707073',
				  minorGridLineColor: '#505053',
				  tickColor: '#707073',
				  tickWidth: 1,
				  title: {
					 style: {
						color: '#E0E0E3'
					 }
				  }
			   },
			   tooltip: {
				  headerFormat:'<span style="font-size: 1em">{point.key}</span><br>',
				  backgroundColor: 'rgba(42, 42, 43, 0.98)',
				  style: {
					 color: '#F0F0F0',
					 fontSize:'1em'
				  }
			   },
			   plotOptions: {
				  series: {
					 dataLabels: {
						color: '#B0B0B3'
					 },
					 marker: {
						lineColor: '#333'
					 }
				  },
				  boxplot: {
					 fillColor: '#505053'
				  },
				  candlestick: {
					 lineColor: 'white'
				  },
				  errorbar: {
					 color: 'white'
				  }
			   },
			   legend: {
				  itemStyle: {
					 color: '#E0E0E3',
					 fontSize: '.85em',
					 fontWeight: 'normal'
				  },
				  itemHoverStyle: {
					 color: '#FFF'
				  },
				  itemHiddenStyle: {
					 color: '#606063'
				  }
			   },
			   credits: {
				  style: {
					 color: '#666'
				  }
			   },
			   labels: {
				  style: {
					 color: '#707073'
				  }
			   },

			   drilldown: {
				  activeAxisLabelStyle: {
					 color: '#F0F0F3'
				  },
				  activeDataLabelStyle: {
					 color: '#F0F0F3'
				  }
			   },

			   navigation: {
				  buttonOptions: {
					 symbolStroke: '#42dca3',
					 theme: {
						fill: '#505053'
					 }
				  },
				  menuItemStyle:{
					  color: '#42dca3'
				  },
				  menuStyle: {
					  background: '#07261a',
					  border: '1px solid #42dca3',
				  }
			   },

			   // scroll charts
			   rangeSelector: {
				  buttonTheme: {
					 fill: '#505053',
					 stroke: '#000000',
					 style: {
						color: '#CCC'
					 },
					 states: {
						hover: {
						   fill: '#707073',
						   stroke: '#000000',
						   style: {
							  color: 'white'
						   }
						},
						select: {
						   fill: '#000003',
						   stroke: '#000000',
						   style: {
							  color: 'white'
						   }
						}
					 }
				  },
				  inputBoxBorderColor: '#505053',
				  inputStyle: {
					 backgroundColor: '#333',
					 color: 'silver'
				  },
				  labelStyle: {
					 color: 'silver'
				  }
			   },

			   navigator: {
				  handles: {
					 backgroundColor: '#666',
					 borderColor: '#AAA'
				  },
				  outlineColor: '#CCC',
				  maskFill: 'rgba(255,255,255,0.1)',
				  series: {
					 color: '#7798BF',
					 lineColor: '#A6C7ED'
				  },
				  xAxis: {
					 gridLineColor: '#505053'
				  }
			   },

			   scrollbar: {
				  barBackgroundColor: '#808083',
				  barBorderColor: '#808083',
				  buttonArrowColor: '#CCC',
				  buttonBackgroundColor: '#606063',
				  buttonBorderColor: '#606063',
				  rifleColor: '#FFF',
				  trackBackgroundColor: '#404043',
				  trackBorderColor: '#404043'
			   },

			   // special colors for some of the
			   legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
			   background2: '#505053',
			   dataLabelsColor: '#B0B0B3',
			   textColor: '#C0C0C0',
			   contrastTextColor: '#F0F0F3',
			   maskColor: 'rgba(255,255,255,0.3)'
			};

			// Apply the theme
			Highcharts.setOptions(Highcharts.theme);
			
			
			(function(H) {
				H.wrap(H.Tooltip.prototype, "refresh", function(c, p, e) {
					if(this.options.reversed && this.options.shared) {
						p.reverse();
					}
					c.call(this, p, e);
				});
			})(Highcharts);
			
		// Fix for chrome exporting issue http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
		var isChrome = !!window.chrome && !!window.chrome.webstore;
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		var isFirefox = typeof InstallTrigger !== 'undefined';
		var isIE = /*@cc_on!@*/false || !!document.documentMode;

		Highcharts.Chart.prototype.downloadServerSide = function(content, extension, mime) {
		  var options = (this.options.exporting || {}).csv || {};
		  Highcharts.post(options.url || 'http://www.highcharts.com/studies/csv-export/download.php', {
			data: content,
			type: mime,
			extension: extension
		  });
		};

		Highcharts.wrap(Highcharts.Chart.prototype, 'downloadXLS', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome) {
			// Handle XLS download on server side
			this.downloadServerSide('<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
			  '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
			  '<x:Name>Ark1</x:Name>' +
			  '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
			  '<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";}</style>' +
			  '<meta name=ProgId content=Excel.Sheet>' +
			  '<meta charset=UTF-8>' +
			  '</head><body>' +
			  this.getTable(true) +
			  '</body></html>', 'xls', 'application/vnd.ms-excel');
		  } else {
			// Continue to call original function
			proceed.apply(this, argList);
		  }
		});


		/* Wrap the client side image export function - going to comment this out - to omuch browser detect IE won't render text after a - with offline-exporting.js removing from grunt library
		Highcharts.wrap(Highcharts.Chart.prototype, 'exportChartLocal', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome || isFirefox || isSafari || isIE) {
			// Call server side exportChart function instead
			this.exportChart.apply(this, argList);
		  } else {
			// Continue to call client side exportChartLocal function
			proceed.apply(this, argList);
		  }
		});*/


		// Wrap the download CSV function
		Highcharts.wrap(Highcharts.Chart.prototype, 'downloadCSV', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome) {
			// Handle CSV download on server side
			this.downloadServerSide(this.getCSV(true), 'csv', 'text/csv');
		  } else {
			// Continue to call original function
			proceed.apply(this, argList);
		  }
		});
			
			// Concentration Chart
			$.get('./data/highcharts/inNAAQSconcentrations19902015.csv', function(csv) {
			$('#concentrationChartHS').highcharts({
					data: {
							csv: csv
						},
					chart: {
						zoomType: 'x',
						alignTicks: false
					},
					title: {
						text: 'National Air Quality Concentration Averages'
					},
					/*subtitle: {
						text: document.ontouchstart === undefined ?
									'Click and drag in the chart area to zoom in' : 'Pinch in the chart area to zoom in'
					},*/
					legend: {
						/*itemDistance: 10,*/
						itemMarginBottom: 8,
						itemWidth: 145,
					},
					xAxis: [{
						type: 'category',
						tickInterval: 5,
						crosshair: true
					}],
					yAxis: [{ // Primary yAxis
						labels: {
							format: '{value}%'
						},
						title: {
							text: 'Percentage Above or Below NAAQS (Excluding Lead)'
						},
						max: 100,
						tickInterval: 25,
						tickColor: 'transparent',
						/*plotBands: [
							{ // Above Most Recent Standard
							from: 0,
							to: 100,
							//color: 'rgba(68, 170, 213, 0.25)',
							label: {
								//text: 'Above Most Recent Standard',
								style: {
									color: '#939393'
									}
								}
							}, 
							{ // Below Most Recent Standard
							from: 0,
							to: -100,
							//color: 'rgba(68, 170, 213, .1)',
							label: {
								//text: 'Below Most Recent Standard',
								style: {
									color: '#939393'
									}
								}
							}],*/
						plotLines: [{
							value: 0,
							width: 2,
							dashStyle: 'dash',
							color: '#c9c9cf',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#c9c9cf',
									fontSize: '.833em'
									}
								}
							}]
					}, { // Secondary yAxis
						title: {
							text: 'Lead (Pb)',
							style: {
								color: Highcharts.getOptions().colors[0]
							}
						},
						labels: {
							format: '{value}%',
							style: {
								color: Highcharts.getOptions().colors[0]
							}
						},
						ceiling: 1300,
						tickInterval: 325,
						min: -1300,
						tickColor: 'transparent',
						gridLineColor: 'transparent',
						opposite: true,
						plotLines: [{
							value: 0,
							width: 2,
							dashStyle: 'dash',
							color: '#c9c9cf',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#c9c9cf',
									fontSize: '.833em'
									}
								}
							}]
					}],
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name +  ': ' + '</span>' + this.y + '%' + '<br/>';
						},
						useHTML: true
					},
					credits: {
								enabled: false
							},
					plotOptions: {
						series: {
							marker: {
								enabled: true,
								radius: .2,
								states: {
									hover: {
										radius: 6
										}
									}
							}
						}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 600,
						filename: "ConcentrationTrends",
						allowHTML: true
					},
					series: [
					{
						yAxis: 1 //*name: 'Pb (3-month)'
					}, 
					{
						yAxis: 0 //*name: 'CO (8-hour)'
					},
					{
						yAxis: 0 //*name: 'NO2 (annual)'
					},
					{
						yAxis: 0 //*name: 'NO2 (1-hour)'
					},
					{
						yAxis: 0 //*name: 'O3 (8-hour)'
					},
					{
						yAxis: 0 //*name: 'PM2.5 (annual)'
					},
					{
						yAxis: 0 //*name: 'PM2.5 (24-hour)'
					},
					{
						yAxis: 0 //*name: 'PM10 (24-hour)'
					},
					{
						yAxis: 0 //*name: 'SO2 (1-hour)'
					}]
				});
			});

			
			// Emission Trends Chart
			$.get('./data/highcharts/national_tier1_caps_totals_noWildfires.csv', function(csv) {
				$('#emissionTrends').highcharts({
					data: {
							csv: csv
						},
					chart: {
						zoomType: 'x',
						alignTicks: false
					},
					title: {
						text: 'National Air Emission Trends'
					},
					/*subtitle: {
						text: document.ontouchstart === undefined ?
									'Click and drag in the chart area to zoom in' : 'Pinch in the chart area to zoom in'
					},*/
					legend: {
						itemMarginBottom: 8,
						itemWidth: 118,
						style: {
							fontSize: '.7em'
						}
					},
					xAxis: [{
						type: 'category',
						tickInterval: 5,
						crosshair: true,
					}],
					yAxis: [{ // Primary yAxis
						labels: {
							formatter: function() {
							  if ( this.value > 1000 ) return Highcharts.numberFormat( this.value/1000, 0) ;  // may be only switched if > 1000
							  return Highcharts.numberFormat(this.value,0);
							}                
						},
						title: {
							text: 'Emissions (Excluding CO), Million Tons'
						},
						
						tickColor: 'transparent',
						
					}, { // Secondary yAxis
						title: {
							text: 'CO Emissions, Million Tons',
							style: {
								color: Highcharts.getOptions().colors[1]
							}
						},
						labels: {
							formatter: function() {
							  if ( this.value > 1000 ) return Highcharts.numberFormat( this.value/1000, 0) ;  // may be only switched if > 1000
							  return Highcharts.numberFormat(this.value,0);
							},
							style: {
									color: Highcharts.getOptions().colors[1]
								}
						},
						min: 0,
						tickColor: 'transparent',
						gridLineColor: 'transparent',
						opposite: true
					}],
					tooltip: {
							shared: true, 
							pointFormatter: function () {
								var symbol = '';
								
								if ( this.graphic && this.graphic.symbolName ) {
									switch ( this.graphic.symbolName ) {
										case 'circle':
										symbol = '&#x25CF';
										break;
										case 'diamond':
											symbol = '&#x25c6';
											break;
										case 'square':
											symbol = '&#x25a0';
											break;
										case 'triangle':
											symbol = '&#x25b2';
											break;
										case 'triangle-down':
											symbol = '&#x25bc';
											break;
									}
								}
								
								else if ( this.marker && this.marker.symbol ) {
									var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
									symbol = '<img src="' + url + '" alt="Marker" />';
								}
								
								return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' million tons' + ' ' + '<br/>';
								
							},
							useHTML: true
						},
					credits: {
								enabled: false
							},
					plotOptions: {
							series: {
								marker: {
									enabled: true,
									radius: .2,
									states: {
										hover: {
											radius: 6
											}
										}
								}
							}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						filename: "EmissionTrends",
						allowHTML: true
					},
					series: [
					{
						yAxis: 1, //*name: 'CO'
						color: Highcharts.getOptions().colors[1]
					}, 
					{
						yAxis: 0, //*name: 'NH3'
						color: Highcharts.getOptions().colors[10]
					},
					{
						yAxis: 0, //*name: 'NOx'
						id: 'NOxSeries',
						color: Highcharts.getOptions().colors[2]
					},
					{
						yAxis: 0, //*name: 'Direct PM2.5'
						color: Highcharts.getOptions().colors[5]
					},
					{
						yAxis: 0, //*name: 'Direct PM10'
						color: Highcharts.getOptions().colors[7]
					},
					{
						yAxis: 0, //*name: 'SO2'
						color: Highcharts.getOptions().colors[8]
					},
					{
						yAxis: 0, //*name: 'VOC'
						color: Highcharts.getOptions().colors[9]
					},
					{
						type: 'flags',
						showInLegend: false,
						tooltip: {
							pointFormatter: function(){
								return 'The National Emissions Inventory (NEI) <br>is compiled every three years with 2014 <br>being the most recent inventory.' ;
							}
						},
						data: [{
							x: 24,
							name: '2014',
							}],
						shape: 'squarepin',
						title: 'NEI 2014',
						y: -120,
						zIndex: 1,
						color: "#a4a4a7",
						lineWidth: .8,
						fillColor: "#646468",
						style: {
							color: "#00ff00"
						}
					},
					{
						type: 'flags',
						showInLegend: false,
						tooltip: {
							pointFormatter: function(){
								return 'State compliance begins for the EPA<br>issued regulation commonly referred<br>to as the NOx SIP Call. This rule<br>required states to reduce ozone season<br>NOx emissions that contribute to ozone<br>nonattainment in other states.' ;
							}
						},
						data: [{
							x: 13,
							name: '2003',
							}],
						shape: 'squarepin',
						title: 'NOx SIP Call',			
						onSeries: 'NOxSeries',
						y: -45,
						zIndex: -1,
						color: "#a4a4a7",
						lineWidth: .8,
						fillColor: "#646468",
						style: {
							color: "#00ff00"
						}
					}]
				});
			
				
				
				var chart = $('#emissionTrends').highcharts();
				$('#modal-1').on('show.bs.modal', function() {
					$('#emissionTrends').css('visibility', 'visible');
				});
				$('#modal-1').on('shown.bs.modal', function() {
					$('#emissionTrends').css('visibility', 'initial');
					chart.reflow();
				}); 
			});
			
			//Emission Sources Stacked Column Chart
			$.get('./data/highcharts/national_tier1_caps_sourceCat_noWildfires.csv', function(csv) {
				$('#emissionsources').highcharts({
					data: {
							csv: csv
						},
					chart: {
						type: 'column',
						inverted: true,
						marginRight: 15,
						spacingLeft: 15
					},
					title: {
						text: 'Emissions by Source Category',
					},
					xAxis: {
						type: 'category'
					},
					yAxis: {
						min: 0,
						tickInterval: 10,
						labels: {
							format: '{value}%'
						},	
						title: {
							text: 'Percentage'
						}
					},
					legend: {
						itemDistance: 45,
						reversed: true,
						itemMarginBottom: 8,
						margin: 12
					},
					tooltip: {
						useHTML: true,
						pointFormatter: function (){
							return '<span style="color:' + this.series.color + '">' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' million tons ' + '(' + Highcharts.numberFormat(this.percentage,'0','%') + '%)' + '<br/>';
						} ,
						shared: true,
						reversed: true,
					},
					plotOptions: {
						column: {
							stacking: 'percent',
							events: {
								legendItemClick: function(){
									return false;
								}
							}
						}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						filename: "EmissionSources",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
				
			//Growth Chart - manual data entry (not csv load); custom markers
				$('#growthChart').highcharts({
					chart: {
							zoomType: 'x',
							backgroundColor: '#2a2a2b'
					},
					title: {
						text: 'Comparison of Growth Areas and Emissions',
						x: -20 //center
					},
					subtitle: {
						text: '1970-2015',
					},
					xAxis: {
						/*tickInterval: 6,*/
						crosshair: true,
						categories: ['1970','1980', '1990','1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005',
							'2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015'],
						tickPositions: [0,3,8,13,18,23],
						tickmarkPlacement: 'on'
						
					},
					yAxis: {
						title: {
						text: 'Percent Growth / Reduction',
						},
						labels: {
							format: '{value}%'
						},
						tickInterval:50,
						max: 300,
						tickColor: 'transparent',
						plotLines: [{
								value: 0,
								width: 2,
								dashStyle: 'dash',
								color: 'white',
						}]
					},
					tooltip: {
						shared: true,
						backgroundColor: '#2a2a2b',
						pointFormatter: function () {
							var symbol = '',
								symbolName;

							function setSymbol(symbolName) {
								switch (symbolName) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							if (this.graphic && this.graphic.symbolName) {
								console.log('1');
								// when marker is enabled
								setSymbol(this.graphic.symbolName);
							} else if (this.marker && this.marker.symbol) {
								console.log('2');
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '');
								symbol = '<img src="' + url + '" alt="Marker" />';
							} else if (this.series.symbol) {
								console.log(this.series);
								// when marker is disabled
								if (/url\(/.test(this.series.symbol)) {
									// and set as graphic
									var url = this.series.symbol.replace(/^url\(|\)$/g, '');
									symbol = '<img src="' + url + '" alt="Marker" />';
								} else {
									// or set as symbol name
									setSymbol(this.series.symbol);
								}
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'0') + '%' + '<br/>';
						},
						useHTML: true
					},
					plotOptions: {
							series: {
								marker: {
									enabled: false,
								}
							}
					},
					credits: {
						enabled: false
					},
					legend: {
						itemMarginBottom: 8,
						itemDistance: 40,
						symbolWidth: 0,
						symbolPadding: 12,
						padding: 0
					},
					exporting: {
						filename: "GrowthAndEmissions",
						
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						chartOptions: {
							plotOptions: {
								series: {
									marker: {
										enabled: false
									}
								}
							}	
						}
					},
					series: [{
						data:[],
						includeInCSVExport: false,
						name:'Gross Domestic Product',
						id:'id-1',
						color: Highcharts.getOptions().colors[3],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)'
						}
					},
					{
						name: 'Gross Domestic Product',
						linkedTo: 'id-1',
						color: Highcharts.getOptions().colors[3],
						data: [0, 36.6, 89.6, 115.5, 123.7, 133.7, 144.1, 155.5, 166, 168.6, 173.4, 181, 191.7, 201.4, 209.5, 215, 214.1, 205.4, 213.1, 218.1, 225.2, 230, 238, 
								{ 
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)',
										enabled: true
								   },
								   y: 246.2
								}],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Vehicle Miles Traveled',
						id:'id-2',
						color: Highcharts.getOptions().colors[1],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)'
						}
					},
					{
						name: 'Vehicle Miles Traveled',
						linkedTo: 'id-2',
						color: Highcharts.getOptions().colors[1],
						data: [0, 37.6, 93.2, 118.3, 123.8, 129.9, 136.8, 142.3, 147.5, 151.9, 157.3, 160.4, 167.1, 169.3, 171.5, 173.1, 168.2, 166.4, 167.3, 165.4, 167.5, 169.2, 174,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)',
										enabled: true
								   },
								   y: 183.6
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Population',
						id:'id-3',
						color: Highcharts.getOptions().colors[2],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)'
						}
					},
					{
						name: 'Population',
						linkedTo: 'id-3',
						color: Highcharts.getOptions().colors[2],
						data: [0, 10.7, 21.5, 29.3, 30.7, 32.2, 34.1, 35.6, 37.6, 39, 40.5, 41.5, 42.9, 44.4, 45.4, 46.8, 48.3, 49.8, 50.7, 52.2, 53.2, 54.1, 55.6,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)',
									   enabled: true
								   },
								   y: 56.6
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Energy Consumption',
						id:'id-4',
						color: Highcharts.getOptions().colors[4],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)'
						}
					},
					{
						name: 'Energy Consumption',
						linkedTo: 'id-4',
						color: Highcharts.getOptions().colors[4],
						data: [0, 15.1, 24.5, 34.2, 38.6, 39.5, 40.1, 42.5, 45.7, 41.8, 43.9, 44.3, 47.5, 47.7, 46.7, 48.9, 45.8, 38.8, 43.7, 42.8, 39.3, 43.3, 45.2,  
								{ 
								   marker: {
									    symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)',
										enabled: true
								   },
								   y: 43.9
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)'
									}
					},
					{
						data:[],
						includeInCSVExport: false,
						name:'CO2 Emissions',
						id:'id-5',
						color: Highcharts.getOptions().colors[0],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)'
						}
					},
					{
						name: 'CO2 Emissions',
						linkedTo: 'id-5',
						color: Highcharts.getOptions().colors[0],
						data: [0, 9.1, 18.2, 25.7, 30.1, 31.8, 32.7, 34.4, 38.5, 36.2, 37.1, 38.2, 40.9, 41.5, 39.6, 41.4, 36.9, 26.8, 31.4, 28.5, 23.6, 27.1,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)',
										enabled: true
								   },
								   y: 28.4
							   }],
									marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)'
								   }
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Aggregate Emissions (Six Common Pollutants)',
						id:'id-6',
						color: Highcharts.getOptions().colors[5],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)'
						}
					},
					{
						name: 'Aggregate Emissions (Six Common Pollutants)',
						linkedTo:'id-6',
						color: Highcharts.getOptions().colors[5],
						data: [0, -17.3, -33, -39.7, -42.9, -42.9, -43.9, -45.8, -47.5, -48.9, -47.6, -49.2, -50.8, -52.1, -54.3, -56.5, -60.2, -62.9, -64.5, -65.6, -66.5, -67.5,-69.5, 
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)',
										enabled:true
								   },
								   y: -71.4
							   }],
							   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)'
								   }
					}]
				});
			
			
			//Weather Chart1 - Urban Ozone
			$.get('./data/highcharts/mettrends_2000_2015_urban.csv', function(csv) {
				$('#weatherChart1').highcharts({
					data: {
							csv: csv
					},
					title: {
						text: 'National Urban Ozone Trend',
						x: -20 //center
					},
					subtitle: {
						text: '111 Locations',
						x: -20
					},
					xAxis: {
						type: 'category',
						tickInterval: 5,
						crosshair: true
					},
					yAxis: {
						tickInterval: 5,
						max: 60,
						min: 45,
						title: {
							text: 'May - September Average Ozone (ppb)'
						},
					},
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'1', '.') + ' ppb' + '<br/>';
						},
						useHTML: true
					},
					legend: {
						itemDistance: 40
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 400,
						filename: "UrbanOzone",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
			
			//Weather Chart2 - Rural Ozone
			$.get('./data/highcharts/mettrends_2000_2015_rural.csv', function(csv) {
				$('#weatherChart2').highcharts({
					data: {
								csv: csv
							},
					title: {
						text: 'National Rural Ozone Trend',
						x: -20 //center
					},
					subtitle: {
						text: '50 Locations',
						x: -20
					},
					xAxis: {
						type: 'category',
						tickInterval: 5,
						crosshair: true
					},
					yAxis: {
						tickInterval: 5,
						max: 60,
						min: 40,
						title: {
							text: 'May - September Average Ozone (ppb)'
						},
					},
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'1', '.') + ' ppb' + '<br/>';
						},
						useHTML: true
					},
					legend: {
						itemDistance: 40
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 400,
						filename: "RuralOzone",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
		});

		/*
JS Modified from a tutorial found here: 
http://www.inwebson.com/html5/custom-html5-video-controls-with-jquery/

I really wanted to learn how to skin html5 video.
*/
$(document).ready(function(){
	//INITIALIZE
	var video = $('#nasa-video');
	
	//remove default control when JS loaded
	video[0].removeAttribute("controls");
	$('.vid-control').fadeIn(500);
	$('.caption').fadeIn(500);
 
	//before everything get started
	video.on('loadedmetadata', function() {
			
		//set video properties
		$('.current').text(timeFormat(0));
		$('.duration').text(timeFormat(video[0].duration));
		updateVolume(0, 0.7);
			
		//start to get video buffering data 
		setTimeout(startBuffer, 150);
			
		//bind video events
		$('.video-viewport')
		.hover(function() {
			$('.vid-control').stop().fadeIn();
			$('.caption').stop().fadeIn();
		}, function() {
			if(!volumeDrag && !timeDrag){
				$('.vid-control').stop().fadeOut();
				$('.caption').stop().fadeOut();
			}
		})
		.on('click', function() {
			$('.btnPly').find('.icon-play').addClass('icon-pause').removeClass('icon-play');
			$(this).unbind('click');
			video[0].play();
		});
	});
	
	//display video buffering bar
	var startBuffer = function() {
		var currentBuffer = video[0].buffered.end(0);
		var maxduration = video[0].duration;
		var perc = 100 * currentBuffer / maxduration;
		$('.bufferBar').css('width',perc+'%');
			
		if(currentBuffer < maxduration) {
			setTimeout(startBuffer, 500);
		}
	};	
	
	//display current video play time
	video.on('timeupdate', function() {
		var currentPos = video[0].currentTime;
		var maxduration = video[0].duration;
		var perc = 100 * currentPos / maxduration;
		$('.timeBar').css('width',perc+'%');	
		$('.current').text(timeFormat(currentPos));	
	});
	
	//CONTROLS EVENTS
	//video screen and play button clicked
	video.on('click', function() { playpause(); } );
	$('.btnPly').on('click', function() { playpause(); } );
	var playpause = function() {
		if(video[0].paused || video[0].ended) {
			$('.btnPly').addClass('paused');
			$('.btnPly').find('.icon-play').addClass('icon-pause').removeClass('icon-play');
			video[0].play();
		}
		else {
			$('.btnPly').removeClass('paused');
			$('.btnPly').find('.icon-pause').removeClass('icon-pause').addClass('icon-play');
			video[0].pause();
		}
	};

	
	//fullscreen button clicked
	$('.btnFS').on('click', function() {
		if($.isFunction(video[0].msRequestFullscreen)) {
			video[0].msRequestFullscreen();
		}	
		else if ($.isFunction(video[0].webkitRequestFullScreen)) {
			video[0].webkitRequestFullScreen();
		}
		else if ($.isFunction(video[0].mozRequestFullScreen)) {
			video[0].mozRequestFullScreen();
		}
		else {
			alert('Fullscreen not available');
		}
	});
	
	//sound button clicked
	$('.sound').click(function() {
		video[0].muted = !video[0].muted;
		$(this).toggleClass('muted');
		if(video[0].muted) {
			$('.volumeBar').css('width',0);
		}
		else{
			$('.volumeBar').css('width', video[0].volume*100+'%');
		}
	});
	
	//VIDEO EVENTS
	//video canplay event
	video.on('canplay', function() {
		$('.loading').fadeOut(100);
	});
	
	//video canplaythrough event
	//solve Chrome cache issue
	var completeloaded = false;
	video.on('canplaythrough', function() {
		completeloaded = true;
	});
	
	//video ended event
	video.on('ended', function() {
		$('.btnPly').removeClass('paused');
		video[0].pause();
	});

	//video seeking event
	video.on('seeking', function() {
		//if video fully loaded, ignore loading screen
		if(!completeloaded) { 
			$('.loading').fadeIn(200);
		}	
	});
	
	//video seeked event
	video.on('seeked', function() { });
	
	//video waiting for more data event
	video.on('waiting', function() {
		$('.loading').fadeIn(200);
	});
	
	//VIDEO PROGRESS BAR
	//when video timebar clicked
	var timeDrag = false;	/* check for drag event */
	$('.progress').on('mousedown', function(e) {
		timeDrag = true;
		updatebar(e.pageX);
	});
	$(document).on('mouseup', function(e) {
		if(timeDrag) {
			timeDrag = false;
			updatebar(e.pageX);
		}
	});
	$(document).on('mousemove', function(e) {
		if(timeDrag) {
			updatebar(e.pageX);
		}
	});
	var updatebar = function(x) {
		var progress = $('.progress');
		
		//calculate drag position
		//and update video currenttime
		//as well as progress bar
		var maxduration = video[0].duration;
		var position = x - progress.offset().left;
		var percentage = 100 * position / progress.width();
		if(percentage > 100) {
			percentage = 100;
		}
		if(percentage < 0) {
			percentage = 0;
		}
		$('.timeBar').css('width',percentage+'%');	
		video[0].currentTime = maxduration * percentage / 100;
	};

	//VOLUME BAR
	//volume bar event
	var volumeDrag = false;
	$('.volume').on('mousedown', function(e) {
		volumeDrag = true;
		video[0].muted = false;
		$('.sound').removeClass('muted');
		updateVolume(e.pageX);
	});
	$(document).on('mouseup', function(e) {
		if(volumeDrag) {
			volumeDrag = false;
			updateVolume(e.pageX);
		}
	});
	$(document).on('mousemove', function(e) {
		if(volumeDrag) {
			updateVolume(e.pageX);
		}
	});
	var updateVolume = function(x, vol) {
		var volume = $('.volume');
		var percentage;
		//if only volume have specificed
		//then direct update volume
		if(vol) {
			percentage = vol * 100;
		}
		else {
			var position = x - volume.offset().left;
			percentage = 100 * position / volume.width();
		}
		
		if(percentage > 100) {
			percentage = 100;
		}
		if(percentage < 0) {
			percentage = 0;
		}
		
		//update volume bar and video volume
		$('.volumeBar').css('width',percentage+'%');	
		video[0].volume = percentage / 100;
		
		//change sound icon based on volume
		if(video[0].volume == 0){
			$('.sound').removeClass('sound2').addClass('muted');
		}
		else if(video[0].volume > 0.5){
			$('.sound').removeClass('muted').addClass('sound2');
		}
		else{
			$('.sound').removeClass('muted').removeClass('sound2');
		}
		
	};

	//Time format converter - 00:00
	var timeFormat = function(seconds){
		var m = Math.floor(seconds/60)<10 ? "0"+Math.floor(seconds/60) : Math.floor(seconds/60);
		var s = Math.floor(seconds-(m*60))<10 ? "0"+Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
		return m+":"+s;
	};
});

//For tab navigation
		// Remove focus outlines
	$("a").keypress(function() {
		 this.blur();
		 this.hideFocus = false;
		 this.style.outline = null;
	});
	$("a").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.outline = 'none';
	});
	$(".hvr-sweep-to-right").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid #42dca3";
	});
	$(".btnPly, .btnFS").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid rgba(0,0,0,0.7)";
	});
	


//For preloader screen
	$(window).load(function() {
		// Animate loader off screen
		$(".se-pre-con").fadeOut("slow");;
	});

;
var ClassifiedPointsMap = function ClassifiedPointsMap(domID,percentSize) {
  this.domID=domID;

//the container size to use for responsiveness
  this.containerID=domID + "-container";
  //This is hacky. Not sure why I changed container to the map div.
  this.containerID=domID;

//set this to make tooltip relative to a div not absolute to page
  this.useRelativeTooltip = false;
//Need to set this if multi tooltip in one host container  
  this.toolTipClass = null;
  
  this.defaultWidth = 870;
  this.defaultHeight = 550;

//If no percent size then calculate from outer container 
  if (percentSize) {
    this.percentSize = percentSize;
  }else {
    this.percentSize = parseInt(d3.select("#" + this.containerID).style('width'))/this.defaultWidth;    
  }

  this.width= this.defaultWidth * this.percentSize;
  this.height=this.defaultHeight * this.percentSize;

//IE 11 needs up to explicity set the height of the div containing the SVG
  d3.select("#" + this.domID).style("height",this.height + "px");
  
  this.pointSize = 6;
//this to keep track of the resized  point size for zooming purposes
  this.scaledPointSize=this.pointSize;
  
  //the current state zoomed in to
  this.activeState = d3.select(null);
  
  //have to pass in topojson object from library
  this.topojson = null;
  
  // Percent Change color categories	 
  //the symbology needs to be passed in
  this.symbology = null;
  //Here is format of symbology
  //symbology = [
  //    {color:d3.rgb(11,39,117),min:0,max:.055},
  //    {color:d3.rgb(34,94,168),min:.055,max:.070},
  //    {color:d3.rgb(196,232,176),min:.070,max:.085},
  //    {color:d3.rgb(255,255,204),min:.085,max:1}
  //]; 
  
  //this will be the mapped attribute in terms of symbology
  this.activeAttribute = null;
  this.hideEmptyActiveAttributes = true;
  //sample activeAttribure
  //var pointVariable="val2000";
  
  //symbology scale changes when new data is loaded
  this.symbologyScale = null;
  //this is place to store tooltip stuff like data that is constant for all points but changes when layer/attribute changes
  this.tooltip={};
//reference to function to call on mouseover to show line on concentration chart
  this.externalMouseOver=null;  
  this.externalMouseOut=null;  
//View Box wasn't working for Mac desktop  
  this.useViewBox = false;
  if (navigator.platform.indexOf('Mac') > -1) {
    this.useViewBox = false;    
  }
  
}

ClassifiedPointsMap.prototype.init = function () {
  var self = this;
  var nudge = 20 * this.width/745;
  this.projection = 
  albersUsaPr()
//  d3.geo.albersUsa()
      .scale(1070*self.percentSize)
      .translate([this.width / 2 + nudge, this.height / 2-0]);
//      .translate([this.width / 2, this.height / 2]);

//console.log(this.width);

  //Albers USA default projection. I think passing null actually means use "no" projection use actual coordinates
  this.path = d3.geo.path()
  //    .projection(null);
      .projection(this.projection);
  
  this.svg = d3.select("#" + this.domID).append("svg")
  
  //If it is apple mobile device then don't use viewBox and set width and height and use translate/scale attribute on resize later
  if (this.useViewBox==false) {
    this.svg
      .attr("width", this.width)
      .attr("height", this.height);    
  } else {
    this.svg.attr("viewBox", "0 0 " + this.width + " " +   this.height);                
  } 

//set up the tooltip
  this.tooltip = new MapChartTooltip(self,self.toolTipClass);  
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
      
  this.pointSymbology = function (d) {  
    //If there is just one class then just return color
    if (self.symbology.breaks.length==0) return self.symbologyScale(0);
    
    var value = parseFloat(d[self.activeAttribute]);
//if value is exactly equal to break point then make it the preceeding class
//because d3 threshold scale uses break 1 <= value < break 2 but we want break 1 < value <= break 2 
//    if (d["AQS_Site_ID"]==="01-051-0001") {
//      console.log("alabama point");
//    }
    var valueBreakpointIndex = self.symbology.breaks.indexOf(value);
    if (valueBreakpointIndex >= 0) {
      return self.symbology.colors[valueBreakpointIndex];      
    }else {
      return self.symbologyScale(value);      
    }
  };  

  this.g = this.svg.append("g");

  this.g.append("rect")
      .attr("class", "background")
      .attr("width", this.width)
      .attr("height", this.height)

//Zoom and Pan

  this.zoomPanBehavior = d3.behavior.zoom()
    .on("zoom", function () {return self.zoomPanHandler(self);});
  this.svg.call(this.zoomPanBehavior).on("dblclick.zoom", null); //don't want the double click zoom

//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.resize();
  }, 200)
};

ClassifiedPointsMap.prototype.zoomPanHandler = function (self) {
  self.genericZoomPan(self,d3.event.translate,d3.event.scale)
};

ClassifiedPointsMap.prototype.genericZoomPan = function (self,translate, scale, useTransition) {
  self.g.style("stroke-width", scale + "px");  //scale county boundaries

//When using ViewBox don't need scale to know about svg being smaller but when not using viewBox it needs to know percent size when resized
  var resizeScale = 1;
  if (this.useViewBox==false) resizeScale = scale*this.percentSize;
  
//  console.log("scale " + resizeScale);
  if (useTransition) {
    self.g.transition()
      .duration(750)
      .attr("transform", "translate(" + translate + ")scale(" + resizeScale + ")")    
  }else {
    self.g
      .attr("transform", "translate(" + translate + ")scale(" + resizeScale + ")")    
  }

//keep points same size when zoooming
    self.g.selectAll("circle")
//    .transition().duration(750)
    .attr("r", self.scaledPointSize/scale)
    .style("stroke-width", self.scaledPointStroke/scale);

//move tooltip since zoom changed point location on screen
    if(self.tooltip.showing) self.tooltip.relocate();
} // end genericZoomPan ()


//function which zooms when double clicked after state zoomed to
ClassifiedPointsMap.prototype.zoomOnDoubleClick = function (d,self) {
//self is ClassifiedPointsMap instance and this is the clicked state
  if (self.activeState.node() === this) {
//zoom in 2X
    var scale = self.zoomPanBehavior.scale()*2;
    var translate = [d3.event.offsetX-scale*d3.mouse(this)[0],d3.event.offsetY-scale*d3.mouse(this)[1]];
//      console.log("d3.mouse(this)[0] " + d3.mouse(this)[0]);
//      console.log("scale translate " + scale + ' ' + translate);
      
//don't need the .event() call does this automatically
//    self.genericZoomPan(self,translate,scale,true);  
//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
    self.zoomPanBehavior.translate(translate).scale(scale)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 
  }else {
    self.zoomToState(this,d,self); //pass this which is the state element
  }
} // end zoomOnDoubleClick()

//function which zooms to state when state double clicked
ClassifiedPointsMap.prototype.zoomToState = function (state, d,self) {
//self is the ClassifiedPointsMap object and state is the clicked state

//Note: no longer return home on double click, instead zoom in for those without scroll wheel
//Use home button now to get back to normal view  
//if (self.activeState.node() === state) return self.resetZoom();
  
  self.activeState.classed("active", false);
  self.activeState = d3.select(state).classed("active", true);

  var bounds = self.path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / self.width, dy / self.height),
      translate = [self.width / 2 - scale * x, self.height / 2 - scale * y];

//If not using ViewBox then need to reduce the translate by percentSize in case they shrunk the screen before zooming to State
    if (this.useViewBox==false) translate = translate.map(function (x) {return self.percentSize*x});
      
//Don't need to do this since .event() fires zoom
//  self.genericZoomPan(self,translate,scale,true);  
//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
  self.zoomPanBehavior.translate(translate).scale(scale)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 


} // end zoomToState()  
  

//function which zooms when double clicked after state zoomed to
  
//function to reset zoom
ClassifiedPointsMap.prototype.resetZoom = function () {
  var self=this;
  this.activeState.classed("active", false);
  this.activeState = d3.select(null);

//Don't need to do this since .event() fires zoom
//  self.genericZoomPan(self,[0,0],1,true);  

//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
  this.zoomPanBehavior.translate([0,0]).scale(1)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 

}; //end reset()  

//map us.json  
ClassifiedPointsMap.prototype.mapStates = function (us) {
  var self=this;
  
	this.g.append("g")
     //.attr("id", "counties")
    .selectAll("path")
     .data(this.topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
     .attr("d", this.path)
	 .attr("class", "county-boundary")
			
	this.g.append("g")
     //.attr("id", "states")
    .selectAll("path")
     .data(this.topojson.feature(us, us.objects.states).features)
    .enter().append("path")
     .attr("d", this.path)
     .attr("class", "feature")
//When state double clicked need to call function that decides whether to zoom to state and show counties or do 2X zoom if already zoomed to state
//Have to call this function in the context of clicked state (this) and pass it the d3 clicked state (d) and ClassifiedPointsMap instance (self)
     .on("dblclick", function (d) {
//       return self.zoomToState.call(this,this,d,self)});
       return self.zoomOnDoubleClick.call(this,d,self)
       });

    this.g.append("path")
     .datum(this.topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
     .attr("id", "state-borders")
     .attr("class", "mesh")
     .attr("d", this.path);

//note sure if i need this. I think it's needed for iframes
//  d3.select(window.frameElement).style("height", this.height + "px");	 
  
};
 
ClassifiedPointsMap.prototype.plotPointsAndLoad = function (pointFile,symbology) {
  var self = this;

  d3.csv(pointFile, function (data) {
    self.plotPoints(data,symbology);
  });
}

ClassifiedPointsMap.prototype.plotPoints = function (pointData,symbology) {
  var self = this;
//set the symbology first so points can use it
  self.setSymbology(symbology);

//remove any existing points and redrea
  self.g.selectAll("circle").remove();      

	self.points = self.g.append("g")
     //.attr("id", "counties")
    .selectAll("circle")
     .data(pointData)
    .enter().append("circle")
               .attr("transform", function(d, i) {
                  var xy = self.projection([d.Longitude, d.Latitude]);
                   return "translate(" + xy + ")";
                })
            .attr("r", this.pointSize)
            .attr("class", "naaq-map-points")
            .style("fill", self.pointSymbology)
            .style("opacity", 1)
            .on('mouseenter', function (d) {
                self.tooltip.hovering=true;
                if (self.tooltip.showing) return;
                self.showToolTip(d,this);
              })
            .on('mouseleave', function () {
                self.tooltip.hovering=false;
                if (self.tooltip.showing) return;
                self.hideToolTip();
              })
            .on('click', function (d) {
//Don't need to do tooltip stuff again since we are hovering it on click (don't want to create duplicate lines)
                if (self.tooltip.hovering && !self.tooltip.showing) return self.tooltip.showing=true;
//hide existing tooltip will hide old line and show again to show new line
                self.hideToolTip();
                self.showToolTip(d,this);
              });
              
//            .on('mouseover', self.pointToolTip.show)
//            .on('mouseout', self.pointToolTip.hide);

//Need tooltip offset to be related to point size for now so just hardcode the point size for now
//  if (! this.pointSize) this.pointSize=parseInt(self.points.attr("r"));

  if (! this.pointStroke) this.pointStroke=parseFloat(self.points.style("stroke-width"));

//Now use resize to set th points to be correct for whatever the SVG is sized at on the screen
    this.resize();

//console.log("percentSize  = " + this.percentSize);
//console.log("re = " + this.pointSize/this.percentSize);
}

//These functions just make working with tooltip easier now that different things happen for click vs hover
 ClassifiedPointsMap.prototype.showToolTip = function (d,element) {
  var self = this;

  if (self.externalMouseOver) {
  //Putting the mouseover thing into custom Render event which happens before copying to ghost div
    self.tooltip.customRender = function () {return self.externalMouseOver(d);};
  }    
  self.tooltip.showToolTip(d,element);  
 };

 ClassifiedPointsMap.prototype.hideToolTip = function () {
  var self = this;
  self.tooltip.hideToolTip();                
  if (self.externalMouseOut) self.externalMouseOut();
 };

 ClassifiedPointsMap.prototype.closeToolTip = function () {
  var self = this;
  self.tooltip.showing = false;
  self.hideToolTip();
 };

 ClassifiedPointsMap.prototype.changeActiveAttribute = function (attribute) {
  this.activeAttribute=attribute;
  this.g.selectAll("circle").style("fill", this.pointSymbology);
//hide points that don't have a value for active attribute
  if (this.hideEmptyActiveAttributes===true) this.g.selectAll("circle").style("display", function (d) {    
    return (d[attribute] || (d[attribute]!=="" && d[attribute]==0)) ? "" : "none";
    });

//Also change what is on the tooltip if attribute changed and it is still showing (eg. on playback)
//Have to call the html function of the element
        this.tooltip.renderToolTip(this.tooltip.currentHoverPoint);
//        d3.select('#sliderText').text(value);        
 };

ClassifiedPointsMap.prototype.setSymbology = function (symbology) {
  var self = this;
  this.symbology = symbology;
//Scale for data rendering  
  this.symbologyScale = d3.scale.threshold()
    .domain(symbology.breaks)
    .range(symbology.colors);

//get category range labels
  var leftLabel;
  this.rangeLabels = symbology.breaks.map(function (d,i) {
    var label;
    if (i==0) {
      label = "<= " + d;      
    }else {
      label = leftLabel + " - " + d;      
    }
    leftLabel=d;
    return label;
  }); 
  this.rangeLabels.push("> " + leftLabel);

  this.drawLegend();  
 };
 
ClassifiedPointsMap.prototype.drawLegend = function (width) {
  //Don't draw legend if there is only one class
  if (this.symbology.breaks.length==0) return;

  if (! width) width = this.width;
  var shapeWidth= Math.min(100,.9*width/this.symbology.colors.length);
     
  this.legendLinear = d3.legend.color()
    .shapeWidth(shapeWidth)
    .shapeHeight(15)
    .orient('horizontal')
    .scale(this.symbologyScale)
    .labels(this.rangeLabels);

    //VERY hacky. need to figure out why i made the containerID the map DOM and not the container
    //Must have been for resonsiveness
  var legendSelect = d3.select("." + this.containerID + "-container .naaqs-map-mapLegend");    
  legendSelect.selectAll("*").remove();

  this.legendElement = legendSelect.append("svg")
      .attr("class","naaqs-map-legendLinear")
    .call(this.legendLinear);
      
  this.legendElement
      .attr("width", this.legendElement.select(".legendCells").node().getBBox().width)
      .attr("height", this.legendElement.select(".legendCells").node().getBBox().height)    
      .style("padding", 0);      

//reset legend font size to what is in the css
  this.legendElement.selectAll(".legendCells .cell .label").style("font-size","");
//Let the font-size cap at what is set in css and shrink down based on shapewidth shrinking
  var maxLegendFontSize = parseInt(this.legendElement.selectAll(".legendCells .cell .label").style("font-size"));
//  this.legendElement.selectAll(".legendCells .cell .label").style("font-size",maxLegendFontSize + "px");

//Let the font-size cap at 12px and shrink down based on shapewidth shrinking
//Find the maximum legend label
  var maxLegendLabelWidth=0;
  this.legendElement.selectAll(".legendCells .cell .label")
    .each(function() {
      width=this.getBBox().width;
      if (width>maxLegendLabelWidth) maxLegendLabelWidth=width;
    })

  var legendFontSize = maxLegendFontSize*Math.min(1,(.8*shapeWidth)/maxLegendLabelWidth);

//console.log("shapeWidth " + shapeWidth + " legendFontSize " + legendFontSize);

//  d3.select("#naaqs-map-mapLegend").style("font-size",legendFontSize + "em")

  this.legendElement.selectAll(".legendCells .cell .label").style("font-size",legendFontSize+"px");
      
};


ClassifiedPointsMap.prototype.resize = function (width) {
    var self = this;
//      console.log('resize');
    if (! width) width = d3.select("#" + this.containerID).style("width");
    if (! width) return;

//note need to divide by wdith which is the SVG view Box size because point size is relative to that
    var oldPercentSize = this.percentSize; //Save the old percent size so we know how much the translation is for 100% size
    this.percentSize = parseInt(width)/this.width;    
 
   //If it is apple mobile device then don't use viewBox and have to use transform on resize event
//    if (isMobile.apple.device) {
    if (this.useViewBox==false) {
      this.svg
          .attr("width", this.width*this.percentSize)
          .attr("height", this.height*this.percentSize);
//Have to take into account zoom/pan -> scale/translate values when resizing
      var scale = this.percentSize*this.zoomPanBehavior.scale();
      //Note: dividing by the oldPercentSize to get translation releative to percentSize=100%
      var translate = this.zoomPanBehavior.translate().map(function (x) {return self.percentSize/oldPercentSize*x});
      this.zoomPanBehavior.translate(translate);
      this.g.attr("transform", "translate(" + translate + ")scale(" + scale + ")");    
    }

//IE 11 needs  to explicity set the height of the div containing the SVG
//need to calculate percent size relative to the default width though
    d3.select("#" + this.domID).style("height",this.defaultHeight*parseInt(width)/this.defaultWidth + "px");

//    console.log(this.defaultHeight*width/this.defaultWidth);
    
    this.scaledPointSize=this.pointSize/this.percentSize;
    this.scaledPointStroke=this.pointStroke/this.percentSize;
    
//adjust these for smaller screens to actually have smaller points but not proportionately
    var minReduction = .25; //this is reduction of point at percentSize=0
    minReduction = 1; //Don't even make points smalle for now so tha they are clickable on mobile for big fingers
    var scaleFactor = Math.min(1,(1-minReduction)*parseInt(width)/this.defaultWidth + minReduction);
    this.scaledPointSize *= scaleFactor;
    this.scaledPointStroke *= scaleFactor;

//If zoom behavior not yet assigned then current zoom factor must be 1
    var currentZoomFactor = 1;
//Get current zoom factor from zoom behavior    
    if (this.zoomPanBehavior) currentZoomFactor = this.zoomPanBehavior.scale();
    
    this.points
            .attr("r", this.scaledPointSize/currentZoomFactor)
            .style("stroke-width", this.scaledPointStroke/currentZoomFactor);
              
//resize the legend also
  this.drawLegend(parseInt(width));  
//Move tooltip if it is clicked open
  if (this.tooltip.currentPointElement) this.tooltip.moveToolTip(this.tooltip.currentPointElement);

  if (this.externalResize) this.externalResize();              
};
;
var LineAreaChart = function LineAreaChart(domID,minimumHeight,heightOverwidth,percentSize,toolTipClass) {
  var self = this;
  this.domID=domID;
  //Can set this to get the container to use for auto sizing
  this.containerID = null;
//this is array of objects
  this.data=null;
  this.standard=null;
  this.defaultWidth = 960;
  this.defaultHeight = 420;

//If no percent size then calculate from outer container 
  this.autoSize = true;
  if (percentSize) {
    this.percentSize = percentSize;
    this.autoSize = false;
  }

  this.margin = { top: 40, right: 20, bottom: 60, left: 80 };  

  this.chartWidth  = this.getChartWidth(this.defaultWidth);
  this.chartHeight = this.getChartHeight(this.defaultHeight);

//Allow aspect ratio to be passed in otherwise just use the default
  this.heightOverwidth = heightOverwidth || this.chartHeight/this.chartWidth;    

//minimumHeight will keep graph from not having usable height on small screens
  this.minimumHeight = minimumHeight || 0;

  this.getAutoSize();
  
//Make the margin scale don't do this for now
//  this.margin.top *= this.width/960;
//  this.margin.bottom *= this.width/960;
//  this.margin.left *= this.height/420;
//  this.margin.right *= this.height/420;

  this.legendWidth = 200,
  this.legendHeight = 90;
  this.title = {};
  this.ytitle = {};  
//These are the x and y field names in which the cross hairs will follow
  this.xField = null;  
  this.yField = null;  
//These are functions that return argument to .domain() call
  this.getXdomain = null;  
  this.getYdomain = null;  
//This sets the step size between tick marks between. If null use default settings
  this.xTickSize = null;
  this.yTickSize = null;
  
//This is the custom function that draws the different areas and lines
  this.drawPaths = null;
//This is the custom function that draws the legend
  this.addLegend = null;
//set the current x value of cross hairs
  this.currentX = null;    
  //this is place to store tooltip data that is constant for all points but changes when layer/attribute changes
  this.tooltipData={};
//reference to slider so moving point will move slider
  this.slider=null;  
  this.useTransitions=false;
//reference to function to call on mouseover
  this.externalMouseOver=null;  
  this.externalMouseOut=null;  

  this.pointSize = 6;
//set up the tooltip
//note: passing optional tooltip class now to differentiate containers with multiple tooltips 
  this.tooltip = new MapChartTooltip(self,toolTipClass);
//show/hide tooltip when hover the wide vertical crosshair
//  this.setTooltipHover(d3.select('#' + this.domID));
     
//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.makeChart();
  }, 200)

};

LineAreaChart.prototype.getChartWidth = function (width) {
  if (! width) width=this.width;
  return width  - this.margin.left - this.margin.right;
};
LineAreaChart.prototype.getChartHeight = function (height) {
  if (! height) height=this.height;
  return height - this.margin.top  - this.margin.bottom;
};

LineAreaChart.prototype.getAutoSize = function () {
//If no percent size then calculate from outer container
  var containerID = this.containerID || this.domID; 
  var selectDomID = d3.select("#" + containerID);
  if (! selectDomID.node()) return;
  if (this.autoSize===true)  {
    this.percentSize = parseInt(selectDomID.style('width'))/this.defaultWidth;      
    this.width= this.defaultWidth * this.percentSize;
  }
//Don't let height go under minimum height. Ok to change aspect ratio on a chart  
//note this.minimumHeight is min chart height
  var scaledChartHeight = Math.max(this.minimumHeight,this.getChartWidth(this.width) * this.heightOverwidth);

  this.height= scaledChartHeight + this.margin.top + this.margin.bottom;
};


//More convenient to call this from outside if needing to show tooltip
LineAreaChart.prototype.showToolTip = function () {
    var self=this;
//have to pass pointElement we are hovering equal to self.dragArea.node() but don't pass data it changes with slider
    if (self.tooltip.showToolTip) self.tooltip.showToolTip(null,self.dragArea.node());
    if (self.externalMouseOver) self.externalMouseOver();  
};

//More convenient to call this from outside if needing to hide tooltip
LineAreaChart.prototype.hideToolTip = function () {
    var self=this;
    if (self.tooltip.hideToolTip) self.tooltip.hideToolTip();
    if (self.externalMouseOut) self.externalMouseOut();  
};

LineAreaChart.prototype.setTooltipHover = function (element) {
  var self = this;
//  element.on('mouseover', function (d) {
  element.on('mouseenter', function (d) {
//    console.log("enter");
      if (self.tooltip.disable!==true) self.showToolTip();
    }).on('mouseleave', function () {
//      console.log("leave");
      self.hideToolTip();      
    });
//    .on('mouseout', function () {
};

LineAreaChart.prototype.makeChart = function () {
//Get the size of the chart using container is auto size=true
    this.getAutoSize();

//if no title then don't have huge margin
  if (! this.title.text) this.margin.top=10;
  
//  this.makeChartDefer = $.Deferred();
  this.chartWidth  = this.getChartWidth();
  this.chartHeight = this.getChartHeight();

//  console.log("this.chartHeight " + this.chartHeight);
//  console.log("this.title.text " + this.title.text);
  
//This works pretty good as a default x domain. just the extent of the x data
  this.getXdomainDefault =  function (self) {return d3.extent(self.data, function (d) { return 1*d[self.xField]; })};
//If they don't set the getXdomain function then use the default
//  if (! this.getXdomain) this.getXdomain =  function (self) {var ex=d3.extent(self.data, function (d) { return 1*d[self.xField]; });ex[1]=2015;return ex};
  if (! this.getXdomain) this.getXdomain =  this.getXdomainDefault;

  var xDomain = this.getXdomain(this);
//this is function that converts x value to screen value
  this.xScale = d3.scale.linear().range([0, this.chartWidth])
//          .domain(d3.extent(this.data, function (d) { return d.year; }));
          .domain(xDomain);

  var yDomain = this.getYdomain(this);
  this.yScale = d3.scale.linear().range([this.chartHeight, 0])
//          .domain([0, 1.1*d3.max(this.data, function (d) { return d.p90; })]);
//          .domain([0.9*d3.min(this.data, function (d) { return d.p10; }), 1.1*d3.max(this.data, function (d) { return d.p90; })]);
          .domain(yDomain);

  var xTickCount = this.chartWidth / (90) + 1;  
  var yTickCount = this.chartHeight / (50) + 1;  

  if (this.xTickSize) {
    xTickCount = (xDomain[1]-xDomain[0])/this.xTickSize + 1;
  }
  if (this.yTickSize) {
    yTickCount = (yDomain[1]-yDomain[0])/this.yTickSize + 1;
  }
  
  this.xAxis = d3.svg.axis().scale(this.xScale).orient('bottom').ticks([xTickCount]).tickFormat(d3.format("d"))
              .innerTickSize(-this.chartHeight).outerTickSize(0).tickPadding(10),
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks([yTickCount])
              .innerTickSize(-this.chartWidth).outerTickSize(0).tickPadding(10);

//if chart it already made them remove it and start again
  d3.select('#' + this.domID + " .naaqs-chart-svg").selectAll("*").remove();

  this.svgBottom = d3.select('#' + this.domID + " .naaqs-chart-svg").append('svg')
    .attr('width',  this.width)
    .attr('height', this.height)
//  .attr("viewBox", "0 0 " + this.width + " " +   this.height)
  this.svg = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

  this.verticalLineGroup = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  
  this.addTitle();
  this.addAxes();
  if (this.addLegend) this.addLegend();
  this.drawPaths();
  this.addVerticalLine();

//now that we have point size we can offeset
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
};



LineAreaChart.prototype.addVerticalLine = function () {
  var self=this;
//  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;
  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;

  this.verticalLine = this.verticalLineGroup.append('line')
//  this.verticalLine = this.svg.append('line')
// .attr('transform', 'translate(100, 50)')
                    .attr({
                        'x1': 0,
                        'y1': 0,
                        'x2': 0,
                        'y2': this.chartHeight
                    })
                    .attr("stroke", "black")
//do this in the css now
//                    .style("stroke-dasharray", ("5, 5"))
                    .attr('class', 'naaqs-chart-crosshair-vertical');

  this.setTooltipHover(this.verticalLine);

  this.horizontalLine = this.svg.append('line')
// .attr('transform', 'translate(100, 50)')
                    .attr({
                        'x1': 0,
                        'y1': 0,
                        'x2': this.chartWidth,
                        'y2': 0
                    })
                    .attr("stroke", "black")
//do this in the css now
//                    .style("stroke-dasharray", ("5, 5"))
                    .attr('class', 'naaqs-chart-crosshair-horizontal');

  this.movingPoint = this.verticalLineGroup.append("circle")
                    .attr("opacity", 0)
                    .attr('class', 'naaqs-chart-movingPoint');
                    
//now get the size of the moving point
  this.movingPoint.style("r",null); //reset to css r value if there is one
  var cssPointSize = parseInt(this.movingPoint.style("r"));
//if there is css point size set then over ride default point size set on LineAreaChart object
  if (cssPointSize) this.pointSize = cssPointSize; //tooltip needs to know the css point size  later so it can offset
  this.movingPoint.style("r",this.pointSize + "px"); //not set r
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
  if (! this.movingPoint.style("r")) this.movingPoint.attr("r",this.pointSize + "px");
                         
//put this below column and allow it to show tolltip whe it races ahead
  this.dragArea = this.verticalLineGroup.append("circle")
                    .attr("opacity", 0)
                    .attr({
                        r: 50
                    })
  this.setTooltipHover(this.dragArea);

//set up a drag event on the moving point that will move the line
//have to call it probably from an area
  this.dragBehavior = d3.behavior.drag()
        .on("drag", function(d,i) {
//          var x = d3.event.x - self.margin.left;
          var x = d3.event.x;
          var xValue = self.xScale.invert(x);
          if (self.slider )  {
  //keep xValue in range of chart
            xValue = Math.min(Math.max(xValue, self.slider.min), self.slider.max);
//          console.log('d3.event x xValue ' + x + ' ' + xValue);

            self.slider.moveSlider(xValue);
//This will snap the point to where the slider is
//            self.slider.slider.value()
//            self.slider.moveSlider(self.slider.slider.value());       
          }else {
//if no slider linking this chart movement to other then just move itself
            self.moveLine(xValue);            
          }
        });        

//  this.verticalLine        
  this.dragArea
  .call(this.dragBehavior);

                            
//initialize to first data point
  if (! this.currentX) this.currentX = this.data[0][self.xField];
  this.moveLine(this.currentX);
  
};

LineAreaChart.prototype.getInterpolatedYvalue = function (x,yLeft,yRight) {
  return 1*yLeft + (1*yRight-1*yLeft)*(x-1*parseInt(x));
}

LineAreaChart.prototype.moveLine = function (value) {
//  console.log("move line " + value);
  var self = this;
//If value is greater than max then don't even try to move line
  var maxValue = this.getXdomainDefault(this)[1];
  if (value>maxValue) return; 
//save this for later eg. when refresh map and don't want cross hairs refreshed  
  this.currentX = value;
  
  var indexRight = this.bisect(this.data, value);
  var indexLeft = 0;
  if (indexRight>0) indexLeft = indexRight-1
//if right on number then item left is now at number 
  if (value==parseInt(value)) indexLeft = indexRight

  var itemRight = this.data[indexRight];
  var itemLeft = this.data[indexLeft];

  var translateX = this.xScale(value);
  var yValue = this.getInterpolatedYvalue(value,itemLeft[self.yField],itemRight[self.yField]);
  var translateY = this.yScale(yValue);

//Force no transition now. before beginning couldn't have transition or it wasn't starting over right
//Now i set the increment from 1000 to 100 to 10 which seems to look good
  if (value<=this.data[0][self.xField] || this.useTransitions!==true) {
//    console.log("no trans " + value);
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-vertical").attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-horizontal").attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
            
    this.dragArea
            .attr("cx", translateX)
            .attr("cy", translateY)
            .call(refreshToolTip);               
            
  } else {
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-vertical").transition().attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-horizontal").transition().attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.transition().attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
//            .each("end",refreshToolTip);      //refresh the tooltip after the transition is done so point is in proper location
            
    this.dragArea
//    .transition()
            .attr("cx", translateX)
            .attr("cy", translateY)    
            .call(refreshToolTip);  //attach tooltip to dragArea which doesn't follow transition
  } 
  
//    console.log(translateX);
//  console.log(translateY);
//Move and rebind the the tooltip
//  this.moveToolTip(translateX,translateY,value,itemLeft,itemRight);
  

//render and move the point but do NOT actually show the point. keep hidden until somebody hovers
  function refreshToolTip() {
//    console.log("refresh tooltip " + value);
    var interpolatedData = {}
    Object.keys(self.data[0]).forEach(function (key) {
          interpolatedData[key] = self.getInterpolatedYvalue(value,itemLeft[key],itemRight[key]);
    });
    self.tooltip.renderToolTip(interpolatedData);
//    setTimeout(function () {
//    self.tooltip.moveToolTip(self.movingPoint.node());
    self.tooltip.moveToolTip(self.dragArea.node(),this.useTransitions);
//    },1000);
  }
};


LineAreaChart.prototype.addTitle = function () {
  this.htmlTitle = d3.select("#" + this.domID + "-container .naaqs-chart-title span");
  this.svgTitle = null;

  var maxFontSize=20;
  var FontSize=20;
  var scale = 1;
  if (! this.htmlTitle.empty()) {
//reset max font size to come from CSS  
    this.htmlTitle.style("font-size","");
    maxFontSize = parseInt(this.htmlTitle.style("font-size"));
    this.htmlTitle.html(this.title.text);
    var available = .9 * $("#" + this.domID + "-container").width();
    scale = $(this.htmlTitle.node()).width() / available;
    FontSize = Math.min(maxFontSize,maxFontSize/scale);
    this.htmlTitle.style("font-size", FontSize + "px");
  }else {
    this.svgTitle = this.svg.append("text")
          .attr("y", 0 - (this.margin.top / 2))
          .attr("text-anchor", "middle")  
          .text(this.title.text);
          
    maxFontSize = parseInt(this.svgTitle.style("font-size"));          
  //shrink the title if it is not fitting on chart
    scale = this.svgTitle.node().getBBox().width / this.chartWidth;
//fit not just chartwidth but full width if over chart width
    if (scale > 1) scale = Math.min(1,this.svgTitle.node().getBBox().width / this.width);
    FontSize = Math.min(maxFontSize,maxFontSize/scale);
    this.svgTitle.style("font-size", FontSize + "px");     

    //center vector title
    this.svgTitle
  //        .attr("x", this.margin.left + (this.chartWidth - this.svgTitle.node().getBBox().width)/2);             
  //        .attr("x", this.chartWidth/2);             
          .attr("x", this.width/2 - this.margin.left);                 
  }
};


LineAreaChart.prototype.addAxes = function () {
  var self=this;

  this.axes = this.svg.append('g')
    .attr('clip-path', 'url(#axes-clip)');

//  this.xAxisElement = this.axes.append('g')
  this.xAxisElement = this.svg.append('g')
    .attr('id', 'naaqs-chart-axis-x')
    .attr('class', 'x naaqs-chart-axis')
    .attr('transform', 'translate(0,' + this.chartHeight + ')')
    .call(this.xAxis);

  this.yAxisElement = this.axes.append('g')
    .attr('class', 'y naaqs-chart-axis')
    .call(this.yAxis);
    
  this.yAxisTitle=this.yAxisElement.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('dy', '.71em')
      .attr('class', 'naaqs-chart-yaxis-title')
      .style('text-anchor', 'middle')
      .text(this.ytitle.text);

  var yAxisFontSize = parseInt(this.yAxisTitle.style("font-size"));

//shrink the title if it is not fitting on chart
  var scaleYaxisTitle = this.yAxisTitle.node().getBBox().width / this.chartHeight;
  if (scaleYaxisTitle > 1) {
    this.yAxisTitle.style("font-size", (yAxisFontSize / scaleYaxisTitle) + "px");     
//      this.yAxisTitle.attr("transform", "translate(" + [(this.chartWidth - scaleLegend*this.legend.node().getBBox().width)/2,this.chartHeight + 35] + ")scale(" + scaleYaxisTitle  + ")");
    
  }

  var yaxisLabelWidth = this.yAxisTitle.node().getBBox().height;
  var yaxisWidth = this.yAxisElement.node().getBBox().width - this.chartWidth;
  this.yAxisTitle
//      .attr('y', 0-this.margin.left)
      .attr('y', 0-1.5*yaxisLabelWidth-yaxisWidth)
      .attr('x', -this.chartHeight/2)

};

;
 var MapChartSlider = function (domID,min,max,step,stepIncrements,stepTime,tickSize,onSlide) {
  var self = this;
  this.domID=domID;

  this.min=min;
  this.max=max;
  this.step=step;
  this.tickSize=tickSize;

  this.stepIncrements = stepIncrements || 1; //this number of increments to complete full step
  this.stepTime = stepTime || 1; //this is number of seconds to complete full step

  this.onSlide=onSlide;

  this.autoPlayInterval = null;
  this.resetSliderTimeout=null;
  this.restartSliderTimeout=null;
  this.currentValue = min;
  this.currentIncrement = 0;
  
  this.slider = null;
  this.refresh(min,max,step,stepIncrements,stepTime,tickSize);
//Play/Stop button will be set for future reference
  this.btnPlay = d3.select('#' + this.domID + ' .btnPlay');
  this.btnStop = d3.select('#' + this.domID + ' .btnStop');  
//need to set up play button click handlers  
  this.setStartStopClickHandlers();
//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.refresh();
  }, 200)

}

MapChartSlider.prototype.refresh = function (min,max,step,stepIncrements,stepTime,tickSize) {
  var self = this;
//console.log("refresh");
  this.min=min || this.min;
  this.max=max || this.max;
  this.step=step || this.step;
  this.tickSize=tickSize || this.tickSize;

  this.stepIncrements = stepIncrements || this.stepIncrements || 1; //this number of increments to complete full step
  this.stepTime = stepTime || this.stepTime || 1; //this is number of seconds to complete full step
  
  this.resize();
//clear out any existing slider stuff first    
  d3.select('#' + self.domID + ' .slider').selectAll("*").remove();  
  
  var axis = d3.svg.axis().orient("bottom").tickFormat(d3.format("d"));
  //If they pass custom tickSize then use it on axis
  if (self.tickSize) {
      var tickCount = (self.max-self.min)/self.tickSize + 1;
      axis.ticks(tickCount);
  }
  self.slider = d3.slider().axis(axis).min(self.min).max(self.max).step(self.step).on("slide", self.onSlide);  

  d3.select('#' + self.domID + ' .slider').call(self.slider);
//set the autoplay stuff to figure when we are at the end
//Total number of increments for each loop
  self.totalIncrements = self.stepIncrements*Math.round((max-min)/step);    
//The size in time slider units of each increment
  self.incrementSize = self.step/self.stepIncrements;    
};



//    moveSlider(currentValue);
MapChartSlider.prototype.moveSlider = function (value) {
//      console.log(value);
      this.slider.value(value);
      this.slider.on("slide")(null,value);		
};

MapChartSlider.prototype.autoIncrement = function (value) {
  var self=this;
//      self.currentValue += self.increment;	
//This was because numbers weren't adding up 
//      self.currentValue=1*(self.currentValue.toFixed(2));	
//      self.currentIncrement += 1;
//      self.currentValue = self.min + self.incrementSize * self.currentIncrement; 

      self.currentValue += self.incrementSize; 
//Assume that we will only ever want say 10 decimal places of precision other wise numbers won't add up to what we want
      self.currentValue=1*(self.currentValue.toFixed(10));	

//      self.currentIncrement = (self.currentValue - self.min)/self.incrementSize;
//if distance to 
//      if (self.currentIncrement > self.totalIncrements ) {
      if (self.currentValue > self.max ) {
//make sure it's moved to the max position while it waits to start over
        self.moveSlider(self.max);                
//        self.currentIncrement = 0;
        self.currentValue=self.min;
        clearInterval(self.autoPlayInterval);
//Have to actual stop incrementing and delay before starting again or graph transitions are wacked out
        self.resetSliderTimeout=setTimeout(function () {
          self.moveSlider(self.currentValue);			          
        },1000*self.stepTime);        
        self.restartSliderTimeout=setTimeout(function () {
          self.autoPlayInterval = setInterval(function () {self.autoIncrement()},1000*self.stepTime/self.stepIncrements);			          
        },1000*self.stepTime+300);//add a little extra after the reset before slider starts moving        
      }else {
         self.moveSlider(self.currentValue);                
      }
      
};

MapChartSlider.prototype.setStartStopClickHandlers = function () {
  var self = this;   
  self.btnStop.on("click",function () {
    self.stop();    
  });      
  self.btnPlay.on("click",function () {
    self.play();    
  });        
};    

MapChartSlider.prototype.stop = function () {
  var self = this;
  clearInterval(self.autoPlayInterval);
  clearTimeout(self.resetSliderTimeout);
  clearTimeout(self.restartSliderTimeout);
  self.autoPlayInterval=null;
  self.resetSliderTimeout=null;
  self.restartSliderTimeout=null;
  self.btnPlay.style("display",null);
  self.btnStop.style("display","none");  
};

MapChartSlider.prototype.play = function () {
  var self = this;
//make sure we are at current value
  self.moveSlider(self.currentValue);
  self.autoPlayInterval = setInterval(function () {self.autoIncrement()},1000*self.stepTime/self.stepIncrements);			

  self.btnPlay.style("display","none");
  self.btnStop.style("display",null);
};

MapChartSlider.prototype.resize = function (width) {
      if (! width) width = d3.select("#" + this.domID).style("width");
      if (! width) return;
      
      d3.select('#' + this.domID + ' .slider').style("width",(parseInt(width)-50) + "px");
};

MapChartSlider.prototype.debounce = function(fn, timeout) 
{
  var timeoutID = -1;
  return function() {
     if (timeoutID > -1) {
        window.clearTimeout(timeoutID);
     }
   timeoutID = window.setTimeout(fn, timeout);
  }
};;
//NOTE: This class requires jQuery for moveTooltip so that tooltip will stay on screen
var MapChartTooltip = function (host,tooltipClass) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
//Pass this tooltip Class when multiple tooltip/class on same host
  this.tooltipClass = tooltipClass || "naaqs-tooltip";
//set offset of tooltip
  this.offset = null;
  
  //this is place to store tooltip stuff like data that is constant for all points but changes when layer/attribute changes
//  this.tooltip={};
//this is extra static data for the tooltip other than that passed to it when rendering
  this.data = {};
  
//this will be set to the point we are currenlty hovering over so that tooltip can be updated as attribute changes 
  this.currentHoverPoint=null;
  this.currentPointElement=null;

  this.div = d3.select("#" + this.host.domID).select("." + this.tooltipClass);

  this.content = this.div.select(".content");  
  this.templateElement = this.div.select(".template");
//check if template is defined before trying to get the text  
  if (! this.templateElement.empty()) this.template = this.templateElement.text();

//This used to get the height and width of tooltip without moving the actual tooltip around because it makes transitions bad
  this.ghostDiv = $(this.div.node()).clone(); 
  $("body").append(this.ghostDiv);
//This to temporarily disable a tooltip from showing when multiple tool tips over same host
  this.disable=false;  
//This to make sure that tooltip should show when not hovering over. ie. They may click and have tooltip be showing without hover
  this.showing=false;  
//This to know that mouse is currently hovering so that click doesn't have to repeat hover stuff
  this.hovering=false;  
  //this is custom function to render after normal render 
  this.customRender = null;
}


MapChartTooltip.prototype.renderToolTip = function (d) {
  var self = this;

//If nothing is passed or not template then don't do anything
  if (! d || ! this.template) return;
  
//Have to pass self because this is in context of the point on map
//add the active attribute to the tooltip so it can be shown
  d.activeAttribute = d[self.host.activeAttribute];
  
//Set the html equal to the template at first and then replace
  var html = this.template;
  
  var matchedFields = html.match(/<<[^>]*>>/g);

  matchedFields.forEach(function (fieldTag) {
      var splitTag = fieldTag.replace(/[<>]/g,"").split(":");
      var field = splitTag[0];
      var value="";
      var isFunction=false;      
//If tag like d.field then this is data on individual point      
      if (/^d\./.test(field)) {
        value = d[field.replace(/^d\./,"")];                
//If tag is like f.function:field then this is a function that is a property on tooltip.data that accepts d.field as arg
      } else if (self.data && /^f\./.test(field)) {
        isFunction=true;
        var arg = null;
        if (splitTag.length>1) arg = d[splitTag[1]];
        if (self.data[field]) value = self.data[field](arg);                
      } else  {
//this is constant data that doesn't vary by data point but can change as map is changed
        value = self.data[field];
      }

//If function then third item is nDigits. otherwise second item is nDigits
      var nDigits = null;
      if (isFunction) {
        if (splitTag.length>2) nDigits = splitTag[2];
      } else {
        if (splitTag.length>1) nDigits = splitTag[1];        
      }
      //Check if nDigits was supplied AND the value is actually a number before rounding to nDigits
      if (nDigits!==null && isFinite(parseFloat(value))) {
        try {
          if (typeof value === "string") value=value.replace(",",""); //replace commas if number is string
          //Let the number of digits be saved in the tooltip data so it can be changed dynamically. 
          //if it is a number just use that
          //If nDigits is not integer. If not assume it is a key and get from tooltip data.
          if (!(parseInt(nDigits)==nDigits && isFinite(nDigits))) nDigits = self.data[nDigits]
//Make sure nDigits saved in tooltip is an integer also
//          if (parseInt(nDigits)==nDigits && isFinite(nDigits)) value = parseFloat(value).toFixed(nDigits);          
          //If nDigits is an integer then do the rounding          
          if (parseInt(nDigits)==nDigits && isFinite(nDigits)) {
            //Note have to actually round to say 10 digits first or calculations that should say exactly equal 3.85 were ending up 3.8499999999999996 and rounding to 3.8 instead of 3.9
            //Don't do the rounding to if we actually want to keep more than 10 
            if (nDigits <= 10) value = parseFloat(value).toFixed(10);
            //use round10 it rounds properly eg. 7.55 to 7.6 not 7.5 
            value = self.round10(parseFloat(value),nDigits);
          }            
        }catch (ex){          
        }        
      }  
      html=html.replace(fieldTag,value);
  },this);  
  
  this.content.html(html);
  if (this.customRender) this.customRender();
  this.ghostDiv.html(this.content.html());
};

//Note this function only rounds off decimals it does not round say 956 to 960
//There is a more comprehensive function for that at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
MapChartTooltip.prototype.round10 = function (value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

MapChartTooltip.prototype.showToolTip = function (d,pointElement) {
      this.div.style("display",null);
//no data passed then just hide/show
      if (d) {
        this.currentHoverPoint=d;
        this.renderToolTip(d);        
      }
//no point Element passed then just hide/show
      if (pointElement) {
        this.currentPointElement = pointElement;
        this.moveToolTip(pointElement);
      }   
};

MapChartTooltip.prototype.hideToolTip = function () {
      this.div.style("display","none");
      this.currentHoverPoint=null;
      this.currentPointElement=null;
};

//This to re-render the current tooltip because something has changed
MapChartTooltip.prototype.refresh = function () {
  this.renderToolTip(this.currentHoverPoint);        
};
//When zooming if tooltip is clicked/forced open need to move tooltip
MapChartTooltip.prototype.relocate = function () {
  this.moveToolTip(this.currentPointElement);        
};


MapChartTooltip.prototype.moveToolTip = function(pointElement,useTransition) {
//by default offset tooltip to the right and down
//local offset is the offset of the top left corner of the tooltip
//this.offset is the offset of the corner that is nearest to the point
  var offset = {x:0,y:0};
//Make a copy of offset  
  if (this.offset) offset = {x:this.offset.x,y:this.offset.y};
  var dist = {};
//  $("#naaqsMap .naaqs-tooltip");
  
  var tooltip = $(this.div.node());
  var pointLocation = $(pointElement).offset();


//  var pointWidth = pointElement.getBBox().width*this.host.percentSize;
//  var pointHeight = pointElement.getBBox().height*this.host.percentSize;

//Use getBoundingClientRect that we can can get size on screen not SVG size because tooltip is positioned by screen pixels
//(when stretching SVG as with map the size of point is decreased so it will stay constant in screen coordinates)
//don't want to use percentsize as i did above because say for charts the getBBox value is always screen pixels even if percentSize changes
//because not strecthing SVG (using ViewBox) when resizing but redrawing it when resizing (no ViewBox)
  var pointWidth = pointElement.getBoundingClientRect().width;
  var pointHeight = pointElement.getBoundingClientRect().height;
  
//  var pointWidth = this.host.pointSize*2;
//  var pointHeight = this.host.pointSize*2;

//move location to middle of point
  pointLocation.left += pointWidth/2;
  pointLocation.top += pointHeight/2;
  
  var windowTop = $(window).scrollTop();
  var windowLeft = $(window).scrollLeft();
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();
    
  dist.top = pointLocation.top - windowTop;
  dist.left = pointLocation.left - windowLeft;
  dist.bottom = windowHeight - dist.top;  
  dist.right = windowWidth - dist.left;  

//remove height/width attirbute and make it liquid to get full width of tooltip
  tooltip.css({width:"auto",height:"auto"}); 
//first move tooltip to top left of screen
//  d3Element.style("left",windowLeft + "px");
//  d3Element.style("top",windowTop + "px");

//  tooltip.css("display","none");
//  tooltip.css({"left":windowLeft + "px","top":windowTop + "px"});
//  tooltip.css("display","");
  
  this.ghostDiv.css({"left":windowLeft + "px","top":windowTop + "px"});

  var tooltipWidth = this.ghostDiv.outerWidth(); 
  var tooltipHeight = this.ghostDiv.outerHeight(); 

//  var tooltipWidth = tooltip.outerWidth(); 
//  var tooltipHeight = tooltip.outerHeight(); 
  
//if tooltip is wider than window than resize to window width
  if (tooltipWidth > windowWidth) {
    tooltip.outerWidth(windowWidth-200);
    tooltipHeight = tooltip.outerHeight(); //recalculate the height since changing width could change it  
  }else {
//Now set the width of the tooltip in css so it doesn't wrap later
    tooltip.outerWidth(tooltipWidth);    
  }
  
//prefer to the right but if not enough room put to the left   
//If not enough space to the right, then check to left
  if (tooltipWidth > dist.right) {
//if left is bigger then put to the left
    if (dist.left > dist.right) {
//resize tooltip to fit left distance if it is too big
      offset.x = -1*Math.min(tooltipWidth+offset.x,dist.left-10);
//      if (tooltipWidth+offset.x > dist.left) {
//        offset.x = -1*(dist.left);
//      }else {
//        offset.x = -1*(offset.x+tooltipWidth);        
//      }
    }else{
        offset.x = -1*(tooltipWidth-dist.right);      
    }  
  }

  
//If not enough space to the bottom, then check to the top
  if (tooltipHeight > dist.bottom) {
//if top is bigger then put to the top
    if (dist.top > dist.bottom) {
//don't shift up more than there is space for
      offset.y = -1*Math.min(tooltipHeight+offset.y,dist.top-5);
//      if (tooltipHeight+offset.y > dist.top) {
//        offset.y = -1*(dist.top);
//      }else{
//        offset.y = -1*(offset.y+tooltipHeight);        
//      }
    }else{
//mnore space at bottom but have to shift up a bit so it will fit on screen
        offset.y = -1*(tooltipHeight-dist.bottom);        
    }  
  }
  
//move the element to the newly computed offset location relative to location of element
//  tooltip.css("left",(pointLocation.left+offset.x) + "px");
//  tooltip.css("top",(pointLocation.top+offset.y) + "px");
  var top = pointLocation.top+offset.y
  var left = pointLocation.left+offset.x
  if (this.host.useRelativeTooltip===true) {
    var hostLocation = $("#" + this.host.domID).offset();   
    top = top - hostLocation.top;
    left = left - hostLocation.left;
  }
  if (useTransition) {
    this.div
    .transition()
    .style("left",left + "px")
    .style("top",top + "px");    
  }else {
    this.div
    .style("left",left + "px")
    .style("top",top + "px");    
  }
    
//  tooltip.css({"left":(pointLocation.left) + "px","top":(pointLocation.top) + "px"});
}; 

;
var MapChartResize = function (host,fn,delay) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
  this.fn = fn;
  this.dealy = delay;

//The d3 onResize hanlder needs a name space so we can have multiple onReisze handlers 
//Then name will be the class type (function name) of the host and the dom ID of the div containing the host
  d3.select(window).on('resize.' + host.constructor.name + '_' + host.domID, this.debounce(fn, delay)); 
}

MapChartResize.prototype.debounce = function(fn, timeout) 
{
  var timeoutID = -1;
  return function() {
     if (timeoutID > -1) {
        window.clearTimeout(timeoutID);
     }
   timeoutID = window.setTimeout(fn, timeout);
  }
};


;
var naaqsMapChart = {};
(function () {
  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2015];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 5;
  var pollutantDropdown = d3.select("#naaqs-pollutant-dropdown").node(); 
  var currentPollutant = pollutantDropdown.options[pollutantDropdown.selectedIndex].value || 'co';
//   currentPollutant = 'co';
	var autoPlay = false;

//This is place to store summary stat information once it is calculated
  var summaryStats = {};
    
//Set up the Map parameters for each pollutant  
  var pollutantData = {};
  pollutantData.symbology = {colors:[
    d3.rgb(13,47,140), 
	d3.rgb(39,107,191),
	d3.rgb(196,232,176),
	d3.rgb(255,255,204)
    
    
       
  ]};
	  
	pollutantData.co = {file:"1990-2015/co.csv",title:"CO 8-hour Concentration",standard:9,units:"ppm",digits:1,pollutantLabel:"CO"}
  pollutantData.co.breaks = [4.4,9.4,12.4];  
  pollutantData.co.emissions = [{file:"co.csv",title:"CO Emissions"}];

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.pb = {file:"1990-2015/pb.csv",title:"Lead 3-month Concentration",standard:.15,units:"\u03BCg/m\u00B3",digits:2,pollutantLabel:"Lead"}
  pollutantData.pb.breaks = [.07,.15,1.0];  
  pollutantData.pb.emissions = [];
  pollutantData.pb.emissionsAlternateText = "As a result of the permanent phase-out of leaded gasoline, controls on emissions of lead compounds through EPA’s air toxics program, and other national and state regulations, airborne lead concentrations in the U.S. decreased 94 percent between 1980 and 2007. Since 1996, national Pb emissions have not changed significantly. In EPA’s most recent national inventory, the 2011 NEI, the highest amounts of Pb emissions are from Piston Engine Aircrafts, and Ferrous and Non-ferrous Metals industrial sources."

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.no2_mean = {file:"1990-2015/no2_mean.csv",title:"NO<sub>2</sub> Annual Concentration",standard:53,units:"ppb",digits:0,pollutantLabel:"NO<sub>2</sub> Annual"}
	pollutantData.no2_mean.breaks = [26,53,100];  
  pollutantData.no2_mean.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"}];
  
  pollutantData.no2_98 = {file:"1990-2015/no2_98.csv",title:"NO<sub>2</sub> 1-hour Concentration",standard:100,units:"ppb",digits:0,pollutantLabel:"NO<sub>2</sub> 1-hour"}
//no2 same for both types
	pollutantData.no2_98.breaks = [53,100,360];
  pollutantData.no2_98.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"}];

  pollutantData.ozone = {file:"1990-2015/ozone.csv",title:"Ozone 8-hour Concentration",standard:.07,units:"ppm",digits:3,pollutantLabel:"Ozone"}
  pollutantData.ozone.breaks = [.055,.07,.085];  
  pollutantData.ozone.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm10 = {file:"1990-2015/pm10.csv",title:"PM<sub>10</sub> 24-hour Concentration",standard:150,units:"\u03BCg/m\u00B3",digits:0,pollutantLabel:"PM<sub>10</sub>"}
  pollutantData.pm10.breaks = [54,154,254];  
  pollutantData.pm10.emissions = [{file:"pm10.csv",title:"Direct PM<sub>10</sub> Emissions"}];

//  pollutantData.pm25_mean = {file:"1999-2015/pm25_mean.csv",title:"PM\u2082.\u2085 Annual Concentration (480 Sites)",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 Mean",minYear:1999}
//Once I make the chart titles HTML I can use this so that subscripts work in IE 11 
  pollutantData.pm25_mean = {file:"2000-2015/pm25_mean.csv",title:"PM<sub>2.5</sub> Annual Concentration",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM<sub>2.5</sub> Annual",minYear:2000}
	pollutantData.pm25_mean.breaks = [6.0,12.0,35.5];  
  pollutantData.pm25_mean.emissions = [{file:"pm2_5.csv",title:"Direct PM<sub>2.5</sub> Emissions"},{file:"so2.csv",title:"SO<sub>2</sub> Emissions"},{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm25_98 = {file:"2000-2015/pm25_98.csv",title:"PM<sub>2.5</sub> 24-hour Concentration",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM<sub>2.5</sub> 24-hour",minYear:2000}
//  pollutantData.pm25_98 = {file:"1999-2015/pm25_98.csv",title:"PM PM\u2082.\u2085 24-hour Concentration (480 Sites)",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 98th",minYear:1999}

//pm 25 same for both types
	pollutantData.pm25_98.breaks = [12.0,35.4,55.4]
  pollutantData.pm25_98.emissions = [{file:"pm2_5.csv",title:"Direct PM<sub>2.5</sub> Emissions"},{file:"so2.csv",title:"SO<sub>2</sub> Emissions"},{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.so2 = {file:"1990-2015/so2.csv",title:"SO<sub>2</sub> 1-hour Concentration",standard:75,units:"ppb",digits:0,pollutantLabel:"SO<sub>2</sub>"}
  pollutantData.so2.breaks = [35,75,185];  
  pollutantData.so2.emissions = [{file:"so2.csv",title:"SO<sub>2</sub> Emissions"}];

  var naaqsMap = new ClassifiedPointsMap("naaqs-map");
  naaqsMap.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  naaqsMap.useRelativeTooltip=true;

  naaqsMap.init();

//Current Pollutant might have a different min Year then normal like PM 2.5
  yearRange[0]=pollutantData[currentPollutant].minYear || defaultMinYear;
    
  naaqsMap.activeAttribute = "val" + yearRange[0] 
  naaqsMap.tooltip.data = {year: yearRange[0],
    pollutant: pollutantData[currentPollutant].pollutantLabel,
    units: pollutantData[currentPollutant].units,
    pollutantDigits: pollutantData[currentPollutant].digits}; 
  naaqsMap.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden"}; 
//Missing values should say NoData not NaN
   naaqsMap.tooltip.data["f.isMissing"] = function (value) {
     return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

  naaqsMap.externalResize = function () {
    setMapTitle();
  };
      
//function that draws location time series on chart when hovering point  
    naaqsMap.externalMouseOver = naaqsMap_externalMouseOver;
    naaqsMap.externalMouseOut = naaqsMap_externalMouseOut;
  
//  d3.select("#mapPollutant").text(pollutantData[currentPollutant].title);
  setMapTitle();
    
  makeEmissionMenu(currentPollutant);
  
//   var concentrationChart = new ConcentrationLineAreaChart();
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var concentrationChart = new LineAreaChart("naaqs-concentrationGraph",125,.25,null,"naaqs-tooltip-concentration"); //passing the min height for the chart
   concentrationChart.margin.top = 10;
   concentrationChart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   concentrationChart.useRelativeTooltip=true;
   concentrationChart.tooltip.data = {units: pollutantData[currentPollutant].units};
   concentrationChart.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden";}; 
//Missing values should say NoData not NaN
   concentrationChart.tooltip.data["f.isMissing"] = function (value) {return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

   concentrationChart.ytitle.text='Concentration (' + pollutantData[currentPollutant].units + ')'
   concentrationChart.xField = "year";
   concentrationChart.yField = "avg";
//This will get the domain when called using the data
   concentrationChart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    concentrationChart.xTickSize = xTickSize;
   
   concentrationChart.getYdomain =  function (self) {
     var min = self.standard;
     var max = self.standard;
     if (self.data.length > 0 && "location" in self.data[0]) {
       min = Math.min(min,d3.min(self.data, function (d) {          
//Note only return truthy or zero otherwise it is null and ignored
         return (d.location || d.location===0) ? 1*d.location : null ; }));
       max = Math.max(max,d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
         return (d.location || d.location===0) ? 1*d.location : null ; }));
     }
     min = Math.min(min,d3.min(self.data, function (d) { return 1*d.p10; }));
     max = Math.max(max,d3.max(self.data, function (d) { return 1*d.p90; }))
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };

//just for convenience define these monster functions at the bottom   
  concentrationChart.drawPaths = concentrationChart_drawPaths;
  concentrationChart.addLegend = concentrationChart_addLegend;
   

//   var emissionChart = new EmissionsLineAreaChart();

   var emissionChart = new LineAreaChart("naaqs-emissionGraph",125,.25);
   emissionChart.margin.bottom = 35;
   emissionChart.margin.top = 10;
   emissionChart.useTransitions = false;
//   emissionChart.margin.bottom = 0;
   
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   emissionChart.useRelativeTooltip=true;
//   emissionChart.ytitle.text='Thousands of Tons'
   emissionChart.ytitle.text='Million Tons'
   emissionChart.xField = "year";
   emissionChart.yField = "total";
//Note for emission chart it will possibly lag the concentration chart by a year but in order to get the emission max year to be saem as conc max year set domain here
  emissionChart.getXdomain =  function () {return yearRange};
//This will get the domain when called using the data
  emissionChart.getYdomain =  function (self) {return [0, 1.1*d3.max(this.data, function (d) { return 1*d.total; })]};
//Set the step between ticks or tick size
  emissionChart.xTickSize = xTickSize;
   
//just for convenience define these monster functions at the bottom   
  emissionChart.drawPaths = emissionChart_drawPaths;
  emissionChart.addLegend = emissionChart_addLegend;

//Set up the slider

//  var naaqsSlider = new MapChartSlider("naaqsSlider",yearRange[0],yearRange[1],1,100,1,onSlide);
//Make full steps don't interpolate between values
  var naaqsSlider = new MapChartSlider("naaqsSlider",yearRange[0],yearRange[1],1,1,1,xTickSize,onSlide);
//This will link chart to slider so chart can move slider
  concentrationChart.slider = naaqsSlider;
  emissionChart.slider = naaqsSlider;
  
d3_queue.queue()
  .defer(makeUSmap,currentPollutant)
//for testing loading map only
//  .defer(makeUSmap,null)
//Don't do this from file anymore. get starts from location data
//  .defer(makeConcentrationGraphFromFile,currentPollutant,yearRange[0])
  .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])
//for now don't have to filter by min year since doing 1990 to 2015 and have all. still pass null so callback will work
//    .defer(makeConcentrationGraph,currentPollutant,null)
//    .defer(makeEmissionGraph,currentPollutant,0,null)
  .await(playMap);



function onSlide(evt,value) {
//only change map if full year not in between ticks
    if (value==parseInt(value)) {
      naaqsSlider.currentValue = value; //save for playback
      d3.select('#sliderText').text(value);
      naaqsMap.tooltip.data.year = value;
      naaqsMap.changeActiveAttribute("val" + value);
//        console.log("year "  + value);
//snap to wherever the slider is now when moving point
//      concentrationChart.moveLine(value,false);
//      emissionChart.moveLine(value,false);
      concentrationChart.moveLine(parseInt(value),true);
      emissionChart.moveLine(parseInt(value),true);
    }
//console.log("move line -> " + value);
//snap to wherever the slider is now when moving point
//      concentrationChart.moveLine(value,false);
//      emissionChart.moveLine(value,false);
}


//function for handling emission menu
  function makeEmissionMenu(pollutant) {
    var emissionMenu = d3.select("#naaqs-emissionMenu ul");
//clear out menu    
    emissionMenu.selectAll("*").remove();
//loop over the emissions for this pollutant
    pollutantData[pollutant].emissions.forEach(function (emission,i) {
//first item is active by default
      var active=false;
      if (i===0) active=true;        
      emissionMenu.append("li").html(emission.title).classed("active",active).on("click",function () {
        makeEmissionGraph(pollutant,i,yearRange[0]);        
//make all not active and then active to only clicked
        d3.select(this.parentNode).selectAll("li").classed("active",false);        
        d3.select(this).classed("active",true);        
      })
    })
  }

function makeUSmap(pollutant,callback) {
//pass non null pollutant if you want to map pollutant after map is created (on first map)
  d3.json("data/d3/us.json", function (error,us) {
    if (error) {
      if (callback) callback(error);
      return;
    }
//This actually creates state map
    naaqsMap.mapStates(us);
    if (pollutant) {
      makeConcentrationLayer(pollutant,callback)
    }else {
      if (callback) callback(null);      
    }
  });
}

function makeMapOrGraph(args,callback) {
//The callback passed to this is necessary for the queue/deferred stuff to work
  d3.csv(args.csv, function (error, data) {
    if (error) {
      if (callback) callback(error);
      return;
    }

//call the custom actions now
    args.actions(data);      
//if you passed something to call back it will go to await function after defer in order of defer
    if (callback) callback(null);
  });
  
}

function makeConcentrationLayer(pollutant,callback) {
//  console.log('begin with conc layer');
  var args = {};
  args.csv = "data/d3/concentrations/" + pollutantData[pollutant].file;
  args.actions = function (data) {
    naaqsMap.tooltip.data.pollutant=pollutantData[pollutant].pollutantLabel; 
    naaqsMap.tooltip.data.units=pollutantData[pollutant].units;
    naaqsMap.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
//Use the breaks for this pollutant
    pollutantData.symbology.breaks = pollutantData[pollutant].breaks;  
    naaqsMap.plotPoints(data,pollutantData.symbology);    
//interpolate the data before generateing the stats
    var interpolatedData = interpolateConcentrations(data);
    
//Now generate the summary stats for this pollutant if it doesn't exist
    if (! summaryStats[pollutant]) summaryStats[pollutant] = generateSummaryStats(interpolatedData);
//    console.log('done with conc layer');


//    console.log(interpolateTimeSeries([null,5,null,7,null]));

    makeConcentrationGraph(currentPollutant);    
  };
  
   makeMapOrGraph(args,callback);
}

function interpolateConcentrations(data) {
  var start = new Date();
  if (! data) return null;
//Have to interpolate over time serie for each location
  var interpolatedData = [];
  var nYears = yearRange[1]-yearRange[0]+1;
  var timeSeries = new Array(nYears);
  var interpolatedSite;
  
  var gapcount=0;

  data.forEach(function (site) {
//get time series
    var year;
    var hasGaps=false;
    for (var i=0; i < nYears; i++) {
      year = yearRange[0]+i;
      var value = parseFloat(site["val"+year]); 
//if value is truthy or zero then assign it to time series value
      if (value || value===0) {
        timeSeries[i] = value;
      }else{
//if value is missing (ie. falsey but not zero) then set it to null
        timeSeries[i] = null;      
        hasGaps=true;
      }     
    }

//get interpolated time series    
    if (hasGaps)  gapcount+=1;

//incredibly strange but this is incredibly slow like 4380 ms vs 446 ms for 458 records with 120 having gaps. crazy.
//I think it was just a chrome thing
//    if (hasGaps) { timeSeries = interpolateTimeSeries(timeSeries);}
    if (hasGaps)  timeSeries = interpolateTimeSeries(timeSeries);

//could possibly copy passed in "site" row also but don't want to write over passed in data so would need clone like jquery.extend
    interpolatedSite={};
    for (var i=0; i < nYears; i++) {
      year = yearRange[0]+i;
      interpolatedSite["val"+year] = timeSeries[i];
    }

    interpolatedData.push(interpolatedSite);
  });
//  console.log("interp time " + (new Date()-start));
//  console.log("gap count " + gapcount);

  return interpolatedData;
}

function interpolateTimeSeries(series) {
  if (! series) return null;
//Have to interpolate over time serie for each location
//First use constant extrapolation for missing endpoints
  var left=series[0];
  var right=null;
  var missing=0;
  var interpolated = new Array(series.length);
  
  series.forEach(function (value,i) {
    interpolated[i]=value;
    if (value===null) missing+=1;
//if not first point and value is not null it will be the right value
//once right value is found we can do stuff and make it the next left value
    if (i>0 && value!==null) {
      right=value;
//first check if left is null. if so then do the constant extrapolation to beginning      
      if (left===null) {
        d3.range(missing).forEach(function (j) {interpolated[j]=right;})   
      }else {
//otherwise interpolate between left and right        
        d3.range(missing).forEach(function (j) {interpolated[i+j-missing]= (j+1)/(missing+1)*(right-left) + left ;})   
      }
//now reset missing and make left = right 
      left=right;
      missing=0;
    }else{
//if this is the end and right is null then extrapolate constant value out to right endpoint
      if (i===series.length-1) d3.range(missing).forEach(function (j) {interpolated[i+j-missing+1]=left;})   
    }
  });
  
//now return interpolated series
  return interpolated;
}

function generateSummaryStats(data) {
//Have to get the stats for each year and add to array
//loop over years
  var stats = [];
  var yearSites; var yearStats;
  for (var year = yearRange[0]; year <= yearRange[1]; year++) {
//now map data for this year to an array    
    yearSites = data.map(function (site) {
      return parseFloat(site["val"+year]);
    }).filter(function (value) {
      return (value || value===0);
    });
//now get the different stats
    yearStats = {year:year};
    yearStats.avg = d3.mean(yearSites);
    yearStats.min = d3.min(yearSites);
    yearStats.max = d3.max(yearSites);
//now sort site values. Note need it to sort numerically not alphabetically
    yearSites.sort(function(a, b){return a-b});
//the d3.quantile is R7 routine that is equivalent to excel PERCENTILE.INC()
//    yearStats.p10 = d3.quantile(yearSites,.1);
//    yearStats.p50 = d3.quantile(yearSites,.5);
//    yearStats.p90 = d3.quantile(yearSites,.9);
//    console.log('year ' + year);
//Now use SAS-5 becuase that is what they have always used
    yearStats.p10 = getPercentile_Sas5(yearSites,.1);
    yearStats.p50 = getPercentile_Sas5(yearSites,.5);
    yearStats.p90 = getPercentile_Sas5(yearSites,.9);
    
    stats.push(yearStats);
  }  

  return stats;  
}

function getPercentile_Exc(data,p) {
//Get percentile using the excel getPercentile.exc routine or R6
  var n = data.length;
  var h = (n + 1)*p

//from p = 0 to 1/(n+1) then return min(data)
  if (h < 1) return data[0];
//from p = n/(n+1) then return max(data)
  if (h > n) return data[n-1];

  var hInt = parseInt(h);
//  console.log("n h hInt data[hInt-1] data[hInt] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1] + ' ' + data[hInt])
//hInt is row starting at 1. need to substract 1 from hInt to get index of data array
  return data[hInt-1] + (h-hInt)*(data[hInt]-data[hInt-1]);
}

function getPercentile_Sas3(data,p) {
//Get percentile using SAS-3 routine
//basically just invert the empirical distribution stair step function.
//ie. Take n*p and round up to nearest integer to get  1-based index. Value at this index is the percentile value. 
  var n = data.length;
  var h = n*p

//now just round UP h and if h < use h=1
//for p = 0 return min(data)
  if (h < 1) return data[0];
  if (h >= n) return data[n-1];

  var hInt = Math.ceil(h);
//  console.log("n h hInt data[hInt-1] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1])

  return data[hInt-1];
}

function getPercentile_Sas5(data,p) {
//Get percentile using SAS-5 routine
//basically just invert the empirical distribution stair step function BUT when h is exact integer then average with neighbor at index+1
//ie. Take n*p and round up to nearest integer if NOT integer to get  1-based index. Value at this index is the percentile value. 
//IF n*p IS an integer then use average of index at that integer and index + 1
  var n = data.length;
  var h = n*p

//now just round UP h and if h < use h=1
//for p = 0 return min(data)
  if (h < 1) return data[0];
  if (h >= n) return data[n-1]; //Note: if h=n there is not h+1 neighbor to average with

  var hInt;

  if (isInteger(h)) {
//    console.log("n h hInt data[h-1] data[h] " + n + ' ' + h + ' ' + data[h-1] + ' ' + data[h]);
    return (data[h-1] + data[h])/2;    
  } else {
    hInt = Math.ceil(h);
//    console.log("n h hInt data[hInt-1] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1]);
    return data[hInt-1];    
  }
}

function isInteger(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

function makeConcentrationGraph(pollutant) {
//    console.log('begin with conc chart');
//summary stats were calculated when concentation layer was read in   
    concentrationChart.data = summaryStats[pollutant];
    concentrationChart.standard = pollutantData[pollutant].standard;
    
    concentrationChart.title.text = pollutantData[pollutant].title;
    concentrationChart.ytitle.text='Concentration (' + pollutantData[pollutant].units + ')'
    concentrationChart.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
    concentrationChart.tooltip.data.units = pollutantData[currentPollutant].units;
    
    concentrationChart.makeChart();
//    console.log('done with conc chart');
}

function makeConcentrationGraphFromFile(pollutant,minYear,callback) {
  var args = {};
  args.csv = "data/d3/concentrations/summarystats/" + pollutantData[pollutant].file;
  args.actions = function (data) {
//filter by year range
    if (minYear) data = data.filter(function (d) {return d.year >= minYear});

    concentrationChart.data = data;
    concentrationChart.standard = pollutantData[pollutant].standard;
    
    concentrationChart.title.text = pollutantData[pollutant].title;
    concentrationChart.ytitle.text='Concentration (' + pollutantData[pollutant].units + ')'
    concentrationChart.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
    concentrationChart.tooltip.data.units = pollutantData[currentPollutant].units;
    
    concentrationChart.makeChart(data);

  };
  
   makeMapOrGraph(args,callback);
}

function makeEmissionGraph(pollutant,emissionIndex,minYear,callback) {
//If not emissions then hide this div and exit
  var hasEmissions = pollutantData[pollutant].emissions.length>0; 
  d3.select("#naaqs-emissionGraph").style('display', hasEmissions ? '' : 'none');
  d3.select("#naaqs-emissionGraph-container #naaqs-chart-legend").style('display', hasEmissions ? '' : 'none');  
  d3.select("#naaqs-emissionGraph-container .naaqs-chart-title").style('display', hasEmissions ? '' : 'none');  
  d3.select("#naaqs-emissionGraph-container #naaqs-emission-alternateText").style('display', 'none');
  if (! hasEmissions) {
//for things like Lead with no emissions show a message
    if (pollutantData[pollutant].emissionsAlternateText) {
      d3.select("#naaqs-emission-alternateText").style('display', '');
      d3.select("#naaqs-emission-alternateText").html(pollutantData[pollutant].emissionsAlternateText);
    } 
//If not drawing graph then still exec callback to that await function will exec
    if (callback) callback(null);
    return;
  }  
  var args = {};
  args.csv = "data/d3/emissions/" + pollutantData[pollutant].emissions[emissionIndex].file;  
  args.actions = function (data) {
//filter by year range
//filter by year range
    if (minYear) data = data.filter(function (d) {return d.year >= minYear});
//add the total column to the data
//convert emissions from thousands of tons to millions of tons (could have done in data file also)
    data = data.map(function (d) {
      d.total = 0;
      ['stationary','industrial','highway','nonroad'].forEach(function (cat) {
        d[cat] = d[cat]/1000;        
        d.total += d[cat];
      });
//      d.total=1*d.stationary+1*d.industrial+1*d.highway+1*d.nonroad; 
      return d;
      });  
    emissionChart.data = data;
    emissionChart.title.text = pollutantData[pollutant].emissions[emissionIndex].title;

    emissionChart.makeChart(data);  

  };
  
   makeMapOrGraph(args,callback);
}


function playMap(error)  {
    if (error) {
      console.error("Error loading charts: ");
      console.error(error);
      return;
    }      
//set up so that the 2 charts tooltips both come up when hovering over one
//note since nothing is passed it will not render or move just hide/show (tooltip is already rendered and moved and line/point is moved)
    concentrationChart.externalMouseOver = function () {emissionChart.tooltip.showToolTip(null,emissionChart.dragArea.node())};
    concentrationChart.externalMouseOut = function () {emissionChart.tooltip.hideToolTip()};
    emissionChart.externalMouseOver = function () {concentrationChart.tooltip.showToolTip(null,concentrationChart.dragArea.node())};
    emissionChart.externalMouseOut = function () {concentrationChart.tooltip.hideToolTip()};
  
    naaqsSlider.moveSlider(naaqsSlider.currentValue);

    if (autoPlay===true) naaqsSlider.play();
} 

function switchPollutant(pollutant) {
//save this globally so that it can be used later
  currentPollutant = pollutant;
  //d3.select("#mapPollutant").text(pollutantData[pollutant].title);  
  setMapTitle(pollutant);

  makeEmissionMenu(pollutant);
//minYear must be passed to make charts if it is on pollutant
  var minYear=pollutantData[pollutant].minYear || defaultMinYear;
    
//if minYear set on pollutant and it changed then redraw slider 
  if (yearRange[0] !== minYear) {
    yearRange[0]=minYear;
    
    naaqsSlider.refresh(yearRange[0],yearRange[1],1,1,1);
//if currentValue is less then make it minYear and move slider to currentValue after re draw of slider    
    if (naaqsSlider.currentValue<minYear) naaqsSlider.currentValue=minYear;
  }

//hide the open tooltip when the pollutant switches
  naaqsMapChart.naaqsMap.closeToolTip();
  
//Make maps and charts  async  
  d3_queue.queue()
    .defer(makeConcentrationLayer,pollutant)
//Don't do this from file anymore. get starts from location data
//    .defer(makeConcentrationGraphFromFile,currentPollutant,yearRange[0])
    .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])
    .await(function () {
//Wait to move the slider until everything is drawn so that things are in correct places
//Also make sure the currentValue is an integer so we are not starting partway through step
      naaqsSlider.moveSlider(parseInt(naaqsSlider.currentValue));
//      console.log("pollutant swtiched");
      });
} 

function setMapTitle() {
    var mapTitle = d3.select("#mapPollutant");
    mapTitle.html(pollutantData[currentPollutant].title);
    mapTitle.style("font-size","");
    var maxFontSize = parseInt(mapTitle.style("font-size"));
    var available = $("#naaqs-map-title").width() - 3.5 * $("#naaqs-map-home").width();
    var scale = Math.max(1,$("#mapPollutant").width() / available);
    mapTitle.style("font-size",maxFontSize/scale + "px");
}

function naaqsMap_externalMouseOver(locationData) {
//this is run in context of concentrationChart
    var self = concentrationChart;

    self.data.forEach(function (item,index) {
      self.data[index].location = locationData["val" + item.year];
    });
     
    self.locationLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .defined(function(d) { return (d.location || (d.location!=="" && d.location==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(d.location); });    

   self.makeChart(self.data);
   
//put this in it's own function so it can be redrawn on resize  
    concentrationChart_drawSelectedLocationLline(locationData);                
    
//refresh the tooltip to show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
    self.moveLine(self.currentX);
}

function concentrationChart_drawSelectedLocationLline() {
//this is run in context of concentrationChart
    var self = concentrationChart;

    self.svg.datum(self.data);
    
    self.locationLineElement = self.svg.append('path')
      .attr('class', 'naaqs-chart-line-location')
      .attr('d', self.locationLine)
      .attr('clip-path', 'url(#rect-clip)');

// add points to line now
//first get the size of the point on small screens
    var minReduction = .25; //this is reduction of point at percentSize=0
    var scaleFactor = Math.min(1,(1-minReduction)*self.percentSize + minReduction);

//     self.locationLinePoints = self.locationLineElement.append("g")
    self.locationLinePoints = self.svg.append("g")
    .attr("class", "naaqs-chart-point-location")
    .selectAll(".dot")
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .data(self.data.filter(function(d) { return (d.location || (d.location!=="" && d.location==0)) ? true : false;}))
    .enter().append("circle")
	.attr('class', 'dot')
    .attr("yval",function(d) { return d.location; })
    .attr("cx", function(d) { return self.xScale(d.year); })
    .attr("cy", function(d) { return self.yScale(d.location); });  

//reset point size to what is in css and then get css point size    
    self.locationLinePoints.style("r",null);
    var pointSize = self.locationLinePoints.style("r");
//if browser such as FF does not support radius r to be set with css then fall back to pointSize set on graph object
    if (! pointSize) pointSize=self.pointSize;    
    var scaledPointSize = parseInt(pointSize)*scaleFactor + "px";
    self.locationLinePoints.style("r",scaledPointSize);
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
    if (! self.locationLinePoints.style("r")) self.locationLinePoints.attr("r",scaledPointSize);
}

function naaqsMap_externalMouseOut(d) {
  var self = concentrationChart;
  
  self.locationLine = null;
  if (self.locationLineElement) self.locationLineElement.remove();
  if (self.locationLinePoints) self.locationLinePoints.remove();
//remove selected location data so it won't be on tooltip
  self.data.forEach(function (item,index) {
//    self.data[index].location = null;
//delete actual attribute so that null is not suse to min y min/max
    delete self.data[index].location;
  });
  self.svg.datum(self.data);
  
   self.makeChart(self.data);
  
//refresh the tooltip to NOT show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
  self.moveLine(self.currentX);
}

  function concentrationChart_drawPaths() {
//        console.log('draw paths');

     var self= this;
    //Draw area
      self.percentileArea = d3.svg.area()
    //    .interpolate('basis')
        .x (function (d) { 
          return self.xScale(d.year); })
        .y0(function (d) { 
          return self.yScale(d.p90); })
        .y1(function (d) { return self.yScale(d.p10); });
    
    //Draw line
      self.averageline = d3.svg.line()
    //    .interpolate('basis')
        .x(function (d) { return self.xScale(d.year); })
        .y(function (d) { return self.yScale(d.avg); });
    
    //Draw standard
      self.standardLine = d3.svg.line()
    //    .interpolate('basis')
        .x(function (d) { return self.xScale(d.year); })
        .y(function (d) { return self.yScale(self.standard); });
      
    
      self.svg.datum(self.data);
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-area naaqs-chart-percentile')
        .attr('d', self.percentileArea)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-line-average')
        .attr('d', self.averageline)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-line-standard')
        .attr('d', self.standardLine)
        .attr('clip-path', 'url(#rect-clip)');
        
    //DraW label for standard
      self.svg.append("text")
    //        .attr("x", this.chartWidth/2) 
    //self.chartWidth
            .attr("x", self.chartWidth - 20*self.percentSize)
            .attr("y", self.yScale(self.standard) - 10 *self.percentSize )
            .attr("text-anchor", "end")  
            //.style('font-weight','bold')
            .style("font-size", ".75em") 
            .text("Most Recent National Standard");    
            
//Now draw the location line if it is showing
      if (self.locationLine)  concentrationChart_drawSelectedLocationLline();            
    };

function concentrationChart_addLegend() {

//try the legend on bottom
  this.legend = this.svg.append('g')
    .attr('class', 'naaqs-chart-legend');

  var legPercentileBox = this.legend.append('rect')
    .attr('class', 'naaqs-chart-percentile')
    .attr('width',  20)
    .attr('height', 20)
    .attr('x', 0)
    .attr('y',0);

//Set the id of tooltip div for the legend since the default "naaqs-tooltip" is for the chart 
  var legPercentileTip = new MapChartTooltip(this,"naaqs-tooltip-legend");  
  legPercentileTip.offset = {x:15,y:-10};

//Don't pass any data to the tooltip. Just use the hardcoded message
  legPercentileBox.on('mouseenter', function () {
                concentrationChart.tooltip.disable=true; //disable the normal tooltiop until we mouse out of legend 
                legPercentileTip.showToolTip(null,this);
                concentrationChart.hideToolTip(); //when legend tooltip shows up hide graph tooltipo and vice versa
              }).on('mouseleave', function () {
                concentrationChart.tooltip.disable=false; //enable the normal tooltip since we moused out of legend 
                legPercentileTip.hideToolTip();
//Don't need to do this anymore since percentile hover doesn't coinicide with vertical bar hover
//                concentrationChart.showToolTip();
              });

  this.legend.append('text')
    .attr('x', 25)
    .attr('y', 15)
    .text('90%ile - 10%ile');

  this.legend.append('path')
    .attr('class', 'naaqs-chart-line-average')
    .attr('d', 'M125,10L145,10');

  this.legend.append('text')
    .attr('x', 150)
    .attr('y', 15)
    .text('National Average');

  this.legend.append('path')
    .attr('class', 'naaqs-chart-line-location')
    .attr('d', 'M270,10L290,10');

  this.legend.append('text')
    .attr('x', 295)
    .attr('y', 15)
    .text('Selected Site');

//center the legend
//  this.legend.attr('transform', 'translate(' + (this.chartWidth - this.legend.node().getBBox().width)/2 + ', ' + (this.chartHeight+2*this.legend.node().getBBox().height) + ')');


  //shrink the legend if it is not fitting on chart width
    var scaleLegend = this.chartWidth/this.legend.node().getBBox().width;
    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,this.width/this.legend.node().getBBox().width);
//Shrink even more just to assure it fits space       
      scaleLegend = .9 * scaleLegend;
      this.legend.attr("transform", "translate(" + [-this.margin.left + (this.width - scaleLegend*this.legend.node().getBBox().width)/2,this.chartHeight+2*this.legend.node().getBBox().height] + ")scale(" + scaleLegend  + ")")
    }else {
  //center the legend
      this.legend.attr('transform', 'translate(' + (this.chartWidth - this.legend.node().getBBox().width)/2 + ', ' + (this.chartHeight+2*this.legend.node().getBBox().height) + ')');    
    }
}


  function emissionChart_drawPaths() {
  var self=this;
//Draw area
  this.stationaryArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(0); })
    .y1(function (d) { return self.yScale(1*d.stationary); });

  this.industrialArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial); });

  this.highwayArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary+1*d.industrial); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial+1*d.highway); });

  this.nonroadArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary+1*d.industrial+1*d.highway); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial+1*d.highway+1*d.nonroad); });

//Draw line
  this.totalLine = d3.svg.line()
//    .interpolate('basis')
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(1*d.total); });


  this.svg.datum(this.data);

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-stationary')
    .attr('d', this.stationaryArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-industrial')
    .attr('d', this.industrialArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-highway')
    .attr('d', this.highwayArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-nonroad')
    .attr('d', this.nonroadArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-line-total')
    .attr('d', this.totalLine)
};



  function emissionChart_addLegend() {
  //Do the legend for emissions
    this.legendContainer = 	d3.select("#" + this.domID + "-container #naaqs-chart-legend");
    var legendY;

    if (this.legendContainer.empty()) {
      if (this.legend) {
        this.legend.selectAll("*").remove();
      }else{
        this.legend = this.svg.append('g')      
          .attr('class', 'naaqs-chart-legend naaqs-chart-emissions');              
      }  
    }
  
    var items = [];
    items.push({class:'naaqs-chart-stationary',
                text1:'Stationary Fuel',
                text2:'Combustion'
                });

    items.push({class:'naaqs-chart-industrial',
                text1:'Industrial and',
                text2: 'Other Processes'
                });

    items.push({class: 'naaqs-chart-highway',
                text1: 'Highway',
                text2: 'Vehicles'
                });

    items.push({class: 'naaqs-chart-nonroad',
                text1: 'Non-Road',
                text2: 'Mobile'
                });
    
//    emissionChart_createLegend(this,items,2,legendY);    
    emissionChart_createLegend(this,items,null,legendY);    
  }
  
  function emissionChart_createLegend(self,items,ncols,legendY) {
    if (! ncols) ncols=items.length;
    
    var cellWidth = 25;
    var cellSpacing = 15;
    var collWidths = [];

//Remove existing legends
    if (self.legendContainer.empty()) {
      if (self.legend) self.legend.selectAll("*").remove();
      legendY = self.chartHeight + 35;
    }else{
      self.legendContainer.selectAll("*").remove();
      self.legendSvg = self.legendContainer.append('svg')
        .attr('width',  self.width)
        .attr('height', 200);
//Need to keep ref to svg and a translated group for centering easier. the legend group itself is group in self.legend
      self.legendSvgGroup = self.legendSvg  
        .append('g')
             .attr('transform', 'translate(' + self.margin.left + ',' + 0 + ')');

      self.legend = self.legendSvgGroup.append('g');

      legendY = 0;
    }

    var cellCount=0;
    var cellX=0;
    var cellY=0;
    var row=0;
    var column=0;
    items.forEach(function (item) {
      if (cellCount===0) {
      }else if(cellCount%ncols===0) {
        cellY+= cellWidth + 10;
        cellX = 0;
        row += 1;
        column = 0;        
      }else{
        if (row===0) collWidths[column]= self.legend.node().getBBox().width + cellSpacing;
        cellX = collWidths[column];        
        column +=1;
      }              
  
      this.rect = self.legend.append('rect')
          .attr('class', item.class)
          .attr('width',  cellWidth)
          .attr('height', cellWidth)
          .attr('x', cellX)
          .attr('y',cellY);
  
      this.text1 = self.legend.append('text')
            .attr('x', cellX + cellWidth+cellSpacing)
            .attr('y', cellY + 10)
            .text(item.text1);
        
      this.text2 = self.legend.append('text')
            .attr('x', cellX + cellWidth+cellSpacing)
            .attr('y', cellY + 25)
            .text(item.text2);
          
      cellCount +=1;
    });
  
//Make this again with 2 cols if it doesn't fit
    if (self.legend.node().getBBox().width > self.width && ncols===items.length) {
      return emissionChart_createLegend(self,items,2,legendY);
    }
    
  //shrink the legend if it is not fitting on chart width
    var scaleLegend = self.chartWidth/self.legend.node().getBBox().width;
    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,self.width/self.legend.node().getBBox().width);
      self.legend.attr("transform", "translate(" + [-self.margin.left + (self.width - scaleLegend*self.legend.node().getBBox().width)/2,legendY] + ")scale(" + scaleLegend  + ")")
    }else {
  //center the legend
      self.legend.attr('transform', 'translate(' + (self.chartWidth - self.legend.node().getBBox().width)/2 + ', ' + (legendY) + ')');    
    }
    if (self.legendSvg) self.legendSvg.attr('height', self.legend.node().getBBox().height);    
    
  }  
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to naaqsMapChart object if neccesary but this should work for now.
  naaqsMapChart.switchPollutant=switchPollutant;
  naaqsMapChart.naaqsMap=naaqsMap;
  naaqsMapChart.concentrationChart=concentrationChart;
  naaqsMapChart.emissionChart=emissionChart;
})()
