$(function() {
    const api = 'https://smileschool-api.hbtn.info/';

    function showLoader($loader, show) {
        $loader.toggle(show);
    }

    function renderQuotes(quotes, $inner) {
        const $loader = $inner.find('.loader');
        $inner.empty();

        quotes.forEach(function(quote, index) {
            const $item = $('<div>').addClass('carousel-item carousel-item-content');
            if (index === 0) {
                $item.addClass('active');
            }
            const $row = $('<div>').addClass('row');
            const $image = $('<img>').addClass('rounded-circle')
                .attr({ src: quote.pic_url, alt: quote.name });
            const $body = $('<div>').addClass('col-sm-8 ml-3 d-flex flex-column')
                .append($('<div>').text('« ' + quote.text + ' »'))
                .append($('<div>').addClass('font-weight-bold mt-3').text(quote.name))
                .append($('<div>').text(quote.title));
            $row.append($('<div>').addClass('col-sm-3 text-center').append($image), $body);
            $inner.append($item.append($row));
        });
        showLoader($loader, false);
    }

    function renderVideo(video, $target) {
        const $card = $('<div>').addClass('video-card text-center col-12 col-sm-6 col-md-3 mb-5');
        const $image = $('<img>').addClass('w-100').attr({
            src: video.thumb_url,
            alt: video.title
        });
        const $details = $('<div>').addClass('mx-3')
            .append($('<div>').addClass('font-weight-bold text-dark text-left mt-3').text(video.title))
            .append($('<div>').addClass('text-secondary text-left mt-3 mb-3').text(video['sub-title']));
        const $author = $('<div>').addClass('d-flex align-items-center mb-3')
            .append($('<img>').attr({
                src: video.author_pic_url,
                alt: video.author
            }).addClass('rounded-circle mr-3 video-carousel-img-profile'))
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

        $target.append($card.append($image, $details.append($author, $rating)));
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
            const cardWidth = $target.children('.video-card').first().outerWidth(true) || 0;
            $target.css('left', (-current * cardWidth) + 'px');
        }

        $carousel.find('.carousel-control-prev, .carousel-control-next')
            .off('click.videoCarousel')
            .on('click.videoCarousel', function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const count = $target.children('.video-card').length;
                const visible = window.innerWidth <= 576 ? 1 : (window.innerWidth <= 768 ? 2 : 4);
                const max = Math.max(0, count - visible);
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
        const $loader = $('#' + loaderId);
        $.ajax({
            url: api + endpoint,
            type: 'GET',
            dataType: 'json',
            beforeSend: function() {
                showLoader($loader, true);
            },
            success: function(videos) {
                $target.empty();
                videos.forEach(function(video) {
                    renderVideo(video, $target);
                });
                showLoader($loader, false);
                setupCardCarousel($target);
            },
            error: function(xhr, status, error) {
                showLoader($loader, false);
                console.error('Could not load ' + endpoint + ': ' + (error || status));
            }
        });
    }

    const $quotes = $('#quotesCarouselInner, #quotesCarouselInsider');
    if ($quotes.length) {
        $.ajax({
            url: api + 'quotes',
            type: 'GET',
            dataType: 'json',
            beforeSend: function() {
                showLoader($quotes.find('.loader'), true);
            },
            success: function(quotes) {
                renderQuotes(quotes, $quotes);
            },
            error: function(xhr, status, error) {
                showLoader($quotes.find('.loader'), false);
                console.error('Could not load quotes: ' + (error || status));
            }
        });
    }

    loadVideos('popular-tutorials', 'TutorialArea', 'TutorialAreaLoader');
    loadVideos('popular-tutorials', 'tutorialvideos', 'VideosLoader');
    loadVideos('latest-videos', 'latestvideos', 'LVideosLoader');

    const $courseResults = $('#coursesvideos');
    if (!$courseResults.length) {
        return;
    }
    const $courseLoader = $('#CoursesLoader');
    const $search = $('#user_search');
    let topicValues = [];
    let sortValues = [];
    let searchTimer;

    function readable(value) {
        return value.replace(/_/g, ' ').replace(/\b\w/g, function(letter) {
            return letter.toUpperCase();
        });
    }

    function buildDropdown($container, id, values, current, onChange) {
        const $button = $('<button>').addClass('btn btn-secondary border-0 rounded-0 search-element w-100 text-left')
            .attr({ type: 'button', id: id, 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' })
            .text(readable(current));
        const $menu = $('<div>').addClass('dropdown-menu').attr('aria-labelledby', id);
        values.forEach(function(value) {
            $('<button>').addClass('dropdown-item').attr({ type: 'button', 'data-value': value })
                .text(readable(value)).appendTo($menu);
        });
        $container.empty().append($button, $menu);
        $menu.on('click', 'button', function() {
            $button.text($(this).text()).attr('data-value', $(this).attr('data-value'));
            onChange($(this).attr('data-value'));
        });
    }

    function requestCourses(q, topic, sort, includeFilters) {
        $.ajax({
            url: api + 'courses',
            type: 'GET',
            dataType: 'json',
            data: includeFilters ? { q: q, topic: topic, sort: sort } : {},
            beforeSend: function() {
                showLoader($courseLoader, true);
            },
            success: function(response) {
                if (!includeFilters) {
                    topicValues = response.topics || [];
                    sortValues = response.sorts || [];
                    $search.val(response.q || '');
                    const topic = topicValues[0] || 'all';
                    const sort = sortValues[0] || 'most popular';
                    buildDropdown($('#topic-menu-container'), 'current-topic', topicValues, topic, function() {
                        requestCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), true);
                    });
                    buildDropdown($('#sort-menu-container'), 'current-sort', sortValues, sort, function() {
                        requestCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), true);
                    });
                    $('#current-topic').attr('data-value', topic);
                    $('#current-sort').attr('data-value', sort);
                    renderCourseResults(response.courses || []);
                    showLoader($courseLoader, false);
                    return;
                }
                renderCourseResults(response.courses || []);
                showLoader($courseLoader, false);
            },
            error: function(xhr, status, error) {
                showLoader($courseLoader, false);
                console.error('Could not load courses: ' + (error || status));
            }
        });
    }

    function renderCourseResults(courses) {
        $courseResults.empty().append($courseLoader);
        courses.forEach(function(course) {
            renderVideo(course, $courseResults);
        });
        $('#numberofvideos').text(courses.length + (courses.length === 1 ? ' video' : ' videos'));
    }

    requestCourses('', '', '', false);
    $search.on('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
            requestCourses($search.val(), $('#current-topic').attr('data-value'), $('#current-sort').attr('data-value'), true);
        }, 300);
    });
});
