document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.section');

    // Define the colors for each section (Updated color for 'get-involved')
    const sectionColors = {
        about: '#A8E6CF',  // Soft Mint Green
        mission: '#4B7F7E', // Muted Teal
        'why-it-matters': '#A0C4FF', // Soft Blue
        'get-involved': '#FFB4A2', // Soft Peach (updated)
        'contact': '#F2E2A6', // Pale Yellow
        'services': '#D1B29E', // Light Taupe
    };

    // Define second set of colors for each section (from the color palette)
    const sectionSecondaryColors = {
        about: '#F2E2A6', // Pale Yellow
        mission: '#D1B29E', // Light Taupe
        'why-it-matters': '#F4E1D2', // Warm Beige
        'get-involved': '#FF6F61', // Soft Coral
        'contact': '#D1B29E', // Light Taupe
        'services': '#A8E6CF', // Soft Mint Green
    };

    // Intersection Observer for section color change
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const sectionId = entry.target.id;
            if (entry.isIntersecting) {
                console.log(`Section ${sectionId} is in view`);

                // Change the background color of the section based on the section ID
                entry.target.style.transition = 'background-color 1s ease';  // Smooth transition
                entry.target.style.backgroundColor = sectionColors[sectionId];
                // Apply secondary background color based on the section visibility
                entry.target.style.backgroundColor = sectionSecondaryColors[sectionId];
            } else {
                // If section is not visible, reset the background color
                entry.target.style.backgroundColor = ''; // Or a fallback color
            }
        });
    }, {
        threshold: 0.5,  // Trigger when section is 50% visible
        rootMargin: '0px 0px -50% 0px' // Detect sections slightly before or after entering the viewport
    });

    // Observe each section
    sections.forEach(section => {
        observer.observe(section);
    });
});
