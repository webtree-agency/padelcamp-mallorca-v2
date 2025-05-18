(function ($) {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const currentYear = new Date().getFullYear();
        document.getElementById('current-year').textContent = currentYear;
        // Lazy Load Video
        const video = document.querySelector("video");
        if (video) {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const source = video.querySelector("source");
                        if (source && source.dataset.src) {
                            source.src = source.dataset.src;
                            video.load();
                        }
                        observer.disconnect();
                    }
                });
            });
            observer.observe(video);

            // Attempt Autoplay
            video.play().catch(error => console.log("Autoplay failed:", error));
        }

        // Offcanvas Navigation Scroll
        const offcanvasElement = document.querySelector('#bdNavbar');
        const offcanvasLinks = document.querySelectorAll('.offcanvas-body a[href^="#"]');
        const navLinks = document.querySelectorAll('.nav-link');
        if (offcanvasElement && offcanvasLinks.length) {
            const offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);

            [...offcanvasLinks, ...navLinks].forEach(link => {
                link.addEventListener('click', function (event) {
                    const targetId = this.getAttribute('href');
                    if (targetId.startsWith("#")) {
                        event.preventDefault();
                        const targetElement = document.querySelector(targetId);

                        if (targetElement) {
                            if (offcanvasElement.classList.contains('show')) {
                                offcanvasInstance.hide();
                            }
                            setTimeout(() => targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
                        }
                    }
                });
            });
        }
    });

    // WhatsApp Icon Click Event
document.addEventListener('DOMContentLoaded', function() {
    const whatsappBtn = document.getElementById("whatsapp-popup");
    const modal = document.getElementById('whatsapp-modal');
    const modalClose = modal.querySelector('.modal__close');
    
    whatsappBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show-modal');
    });
    
    modalClose.addEventListener('click', function() {
        modal.classList.remove('show-modal');
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show-modal');
        }
    });
});

    // Initialize Swiper
    new Swiper('.testimonial-swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: { el: '.testimonial-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });

    // Isotope Filtering
    $(window).on('load', function () {
        const $container = $('.isotope-container').isotope({ itemSelector: '.item', filter: '.kitesurf-lessons' });

        $('.filter-button').on('click', function () {
            const filterValue = $(this).data('filter');
            $('.filter-button').removeClass('active');
            $(this).addClass('active');
            $container.isotope({ filter: filterValue });

            $('.detail-view').removeClass('active');
            if (filterValue !== '*') {
                $(filterValue).addClass('active');
            }
        });

        $('.filter-button.active').trigger('click');

        setTimeout(() => document.body.classList.add('loaded'), 300);
    });

})(jQuery);
