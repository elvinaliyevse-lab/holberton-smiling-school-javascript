$(function() {
    const api = 'https://smileschool-api.hbtn.info/xml/';

    function showLoader($loader, show) {
        $loader.toggle(show);
    }

    function childText($element, name) {
        return $element.children(name).first().text();
    }

    function quoteFromXml(element) {
        const $quote = $(element);
        return {
            pic_url: childText($quote, 'pic_url'),
            text: childText($quote, 'text'),
            name: childText($quote, 'name'),
            title: childText($quote, 'title')
        };
    }

    function videoFromXml(element) {
        const $video = $(element);
        return {
            thumb_url: childText($video, 'thumb_url'),
            title: childText($video, 'title'),
            'sub-title': childText($video, 'sub-title'),
            author_pic_url: childText($video, 'author_pic_url'),
            author: childText($video, 'author'),
            star: $video.attr('star') || childText($video, 'star'),
            duration: childText($video, 'duration')
        };
    }

    function renderQuotes(quotes, $inner) {
        const $loader = $inner.find('.loader');
        $inner.empty();
        quotes.forEach(function(quote, index) {
            const $item = $('<div>').addClass('carousel-item carousel-item-content');
            if (index === 0) {
                $item.addClass('active');
            }
            const $row = $('<div>').addClass('row')
                .append($('<div>').addClass('col-sm-3 text-center')
                    .append($('<img>').addClass('rounded-circle')
                        .attr({ src: quote.pic_url, alt: quote.name })))
                .append($('<div>').addClass('col-sm-8 ml-3 d-flex flex-column')
                    .append($('<div>').text('« ' + quote.text + ' »'))
                    .append($('<div>').addClass('font-weight-bold mt-3').text(quote.name))
                    .append($('<div>').text(quote.title)));
            $inner.append($item.append($row));
        });
        showLoader($loader, false);
    }

    function renderVideo(video, $target) {
        const $card = $('<div>').addClass('video-card text-center col-12 col-sm-6 col-md-3 mb-5');
        const $details = $('<div>').addClass('mx-3')
            .append($('<div>').addClass('font-weight-bold text-dark text-left mt-3').text(video.title))
            .append($('<div>').addClass('text-secondary text-left mt-3 mb-3').text(video['sub-title']));
        const $author = $('<div>').addClass('d-flex align-items-center mb-3')
            .append($('<img>').addClass('rounded-circle mr-3 video-carousel-img-profile')
                .attr({ src: video.author_pic_url, alt: video.author }))
            .append($('<div>').addClass('purple-text font-weight-bold').text(video.author));
        const $stars = $('<div>').addClass('d-flex pt-1');
        const rating = Number(video.star) || 0;
        for (let i = 0; i < 5; i++) {
            $stars.append($('<img>').addClass('carousel-star-icon' + (i < rating ? ' mr-1' : ''))
                .attr({
                    src: i < rating ? './images/star_on.png' : './images/star_off.png',
                    alt: i < rating ? 'star' : 'empty star'
                }));
        }
        const $rating = $('<div>').addClass('d-flex justify-content-between')
            .append($stars)
            .append($('<div>').addClass('purple-text font-weight-bold').text(video.duration));
        $target.append($card.append(
            $('<img>').addClass('w-100').attr({ src: video.thumb_url, alt: video.title }),
            $details.append($author, $rating)
        ));
    }

    function setupCardCarousel($target) {
        const $carousel = $target.closest('.carousel');
        let current = 0;
        $carousel.removeAttr('data-ride');
        $carousel.find('.carousel-control-prev, .carousel-control-next').removeAttr('data-slide');

        function update() {
            const count = $target.children('.video-card').length;
            const visible = window.innerWidth <= 576 ? 1 : (window.innerWidth <= 768 ? 2 : 4);
            const max = Math.max(0, count - visible);
            current = Math.min(current, max);
            const width = $target.children('.video-card').first().outerWidth(true) || 0;
            $target.css('left', (-current * width) + 'px');
        }

        $carousel.find('.carousel-control-prev, .carousel-control-next')
            .off('click.videoCarousel')
            .on('click.videoCarousel', function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const visible = window.innerWidth <= 576 ? 1 : (window.innerWidth <= 768 ? 2 : 4);
                const max = Math.max(0, $target.children('.video-card').length - visible);
                current = $(this).hasClass('carousel-control-next')
                    ? Math.min(current + 1, max)
                    : Math.max(current - 1, 0);
                update();
            });
        $(window).off('resize.' + $target.attr('id')).on('resize.' + $target.attr('id'), update);
        update();
    }

    function loadVideos(endpoint, targetId, loaderId) {
        const $target = $('#' + targetId);
        if (!$target.length) {
            return;
        }
        $target.addClass('video-card-track');
        const $loader = $('#' + loaderId);
        $.ajax({
            url: api + endpoint,
            type: 'GET',
            dataType: 'xml',
            beforeSend: function() {
                showLoader($loader, true);
            },
            success: function(response) {
                const videos = $(response).find('video').map(function() {
                    return videoFromXml(this);
                }).get();
                $target.empty();
                videos.forEach(function(video) {
                    renderVideo(video, $target);
                });
                showLoader($loader, false);
                setupCardCarousel($target);
            },
            error: function(xhr, status, error) {
                showLoader($loader, false);
                console.error('Could not load XML ' + endpoint + ': ' + (error || status));
            }
        });
    }

    const $quotes = $('#quotesCarouselInner, #quotesCarouselInsider');
    if ($quotes.length) {
        $.ajax({
            url: api + 'quotes',
            type: 'GET',
            dataType: 'xml',
            beforeSend: function() {
                showLoader($quotes.find('.loader'), true);
            },
            success: function(response) {
                const quotes = $(response).find('quote').map(function() {
                    return quoteFromXml(this);
                }).get();
                renderQuotes(quotes, $quotes);
            },
            error: function(xhr, status, error) {
                showLoader($quotes.find('.loader'), false);
                console.error('Could not load XML quotes: ' + (error || status));
            }
        });
    }

    loadVideos('popular-tutorials', 'TutorialArea', 'TutorialAreaLoader');
    loadVideos('popular-tutorials', 'tutorialvideos', 'VideosLoader');
    loadVideos('latest-videos', 'latestvideos', 'LVideosLoader');

    const $results = $('#coursesvideos');
    if (!$results.length) {
        return;
    }
    const $loader = $('#CoursesLoader');
    const $search = $('#user_search');
    let timer;

    function readable(value) {
        return value.replace(/_/g, ' ').replace(/\b\w/g, function(letter) {
            return letter.toUpperCase();
        });
    }

    function displayCourses(courses) {
        $results.empty().append($loader);
        courses.forEach(function(course) {
            renderVideo(course, $results);
        });
        $('#numberofvideos').text(courses.length + (courses.length === 1 ? ' video' : ' videos'));
    }

    function fetchCourses(q, topic, sort, initial) {
        $.ajax({
            url: api + 'courses',
            type: 'GET',
            dataType: 'xml',
            data: initial ? {} : { q: q, topic: topic, sort: sort },
            beforeSend: function() {
                showLoader($loader, true);
            },
            success: function(response) {
                const $xml = $(response);
                if (initial) {
                    const topics = $xml.find('topics').children('topic').map(function() {
                        return $(this).text();
                    }).get();
                    const sorts = $xml.find('sorts').children('sort').map(function() {
                        return $(this).text();
                    }).get();
                    const initialQ = $xml.find('q').first().text();
                    $search.val(initialQ);

                    function addDropdown(containerId, buttonId, values, selected, changed) {
                        const $container = $('#' + containerId).empty();
                        const $button = $('<button>').addClass('btn btn-secondary border-0 rounded-0 search-element w-100 text-left')
                            .attr({ type: 'button', id: buttonId, 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'data-value': selected })
                            .text(readable(selected));
                        const $menu = $('<div>').addClass('dropdown-menu').attr('aria-labelledby', buttonId);
                        values.forEach(function(value) {
                            $('<button>').addClass('dropdown-item').attr({ type: 'button', 'data-value': value })
                                .text(readable(value)).appendTo($menu);
                        });
                        $menu.on('click', 'button', function() {
                            $button.text($(this).text()).attr('data-value', $(this).attr('data-value'));
                            changed();
                        });
                        $container.append($button, $menu);
                    }

                    const topic = topics[0] || 'all';
                    const sort = sorts[0] || 'most popular';
                    addDropdown('topic-menu-container', 'current-topic', topics, topic, function() {
                        fetchCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), false);
                    });
                    addDropdown('sort-menu-container', 'current-sort', sorts, sort, function() {
                        fetchCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), false);
                    });
                }
                const courses = $xml.find('courses').children('course').map(function() {
                    const $course = $(this);
                    const video = videoFromXml(this);
                    if (!video.star) {
                        video.star = childText($course, 'star');
                    }
                    return video;
                }).get();
                displayCourses(courses);
                showLoader($loader, false);
            },
            error: function(xhr, status, error) {
                showLoader($loader, false);
                console.error('Could not load XML courses: ' + (error || status));
            }
        });
    }

    fetchCourses('', '', '', true);
    $search.on('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
            fetchCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), false);
        }, 300);
    });
});
