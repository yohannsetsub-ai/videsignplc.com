import {workDetails} from './data.js';


const initialPage = window.location.hash.replace('#', '') || '#home';



const validPages = ["home", "work", "people", "contact"];


const validworkPages = [
                        "work-1", "work-2", "work-3", "work-4", "work-5", "work-6", "work-7", "work-8", 
                        "work-9", "work-10", "work-11", "work-12", "work-13", "work-14" , "work-15"
                    ];

const nav = document.querySelector('header nav')
const nav_ul = document.querySelector('header nav ul')




function toggleMenu() {
    nav.classList.toggle('show');
}

window.toggleMenu = toggleMenu;



document.addEventListener('DOMContentLoaded', () => {
    
    if (validPages.includes(initialPage)) {
        const link = document.querySelector(`nav ul li a[href="#${initialPage}"]`);
        showSection(initialPage, link);
    }
    else if (validworkPages.includes(initialPage)) {
        showWorkDetail(initialPage)
    }
    else {
        showSection('home', document.querySelector(`nav ul li a[href="#home"]`));
    }   
});



window.addEventListener('hashchange', () => {
    let hash = window.location.hash.replace('#', '');

    
    if (validPages.includes(hash)) {
        const link = document.querySelector(`nav ul li a[href="#${hash}"]`);
        showSection(hash, link);
    }
    else if (validworkPages.includes(hash)) {
        showWorkDetail(hash)
    } 
    else {
        showSection('home', document.querySelector(`nav ul li a[href="#home"]`));
    }
});




function showSection(sectionId, element) {

    nav.classList.remove('show');
    nav_ul.classList.remove('show');


    document.querySelectorAll('ul li a').forEach(link => {
        link.classList.remove('active');
    });

    if (sectionId === 'contact') {
        document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
        return;
    } else if (validPages.includes(sectionId)) {

        if (element) {
            element.classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        document.getElementById(sectionId).classList.remove('hidden');

        // if (!history.state || history.state.section !== sectionId) {
        //     history.pushState({section: sectionId}, '', `#${sectionId}`);
        // }
    }
}

window.showSection = showSection;


// Add an event listener to handle browser back/forward navigation
window.addEventListener('popstate', function(event) {
        
        
    const section = event.state && event.state.section ? event.state.section : 'home';
    const link = document.querySelector(`nav ul li a[href="#${section}"]`);
    console.log(section);
    showSection(section, link);
});





function showWorkDetail(workId) {

    const workIdNum = parseInt(workId.replace('work-', ''));
    const work = workDetails['work' + workIdNum];

    if (work) {
        document.getElementById('work-title').textContent = work.title;
        document.getElementById('work-description').textContent = work.description;


        // New: dynamic link/meta
        const meta = document.getElementById('work-link');
        meta.innerHTML = ''; // clear previous

        // If your data has a link, add it (supports string or { href, text } object)
        if (work.link) {
            const a = document.createElement('a');

            a.href = typeof work.link === 'string' ? work.link : work.link.href;
            a.textContent = typeof work.link === 'string' ? 'View link: virtual tour' : (work.link.text || 'View link: virtual tour');
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'work-link-class'; // optional class if you want to style it
            meta.appendChild(a);
        }


        // Clear previous slideshow content
        const slideshowContainer = document.getElementById('work-images-slideshow');
        slideshowContainer.innerHTML = "";
        work.images.forEach((image, index) => {
            var mainSlideDiv = document.createElement('div');
            mainSlideDiv.className = 'mainSlideDiv';

            var numberTextDiv = document.createElement('div');
            numberTextDiv.className = 'mainSlideDivNum';
            numberTextDiv.textContent = `${index + 1} / ${work.images.length}`;;

            var imgElement = document.createElement('img');
            imgElement.className = 'mainSlideDivImg';
            imgElement.src = image;
            imgElement.alt = work.title;
            imgElement.setAttribute('loading', 'lazy');
            // imgElement.addEventListener('click', () => openImageFullScreen(image, index, work.images));
            imgElement.style.width = '100%';

            // Add navigation buttons
            const prevButton = document.createElement('a');
            prevButton.className = 'mainSlidePrev';
            prevButton.textContent = '❮';
            prevButton.onclick = () => plusSlides(-1);

            const nextButton = document.createElement('a');
            nextButton.className = 'mainSlideNext';
            nextButton.textContent = '❯';
            nextButton.onclick = () => plusSlides(1);

            mainSlideDiv.appendChild(prevButton);
            mainSlideDiv.appendChild(nextButton);       
            
            mainSlideDiv.appendChild(numberTextDiv);
            mainSlideDiv.appendChild(imgElement);
            slideshowContainer.appendChild(mainSlideDiv);
        });


        // Add thumbnail row
                const mainSlideRow = document.createElement('div');
                mainSlideRow.className = 'rowSlide';

                work.images.forEach((image, index) => {
                    // const columnDiv = document.createElement('div');
                    // columnDiv.className = 'rowSlidecolumn';

                    const thumbnailImg = document.createElement('img');
                    thumbnailImg.className = 'rowSlidecolumnimg';
                    thumbnailImg.src = image;
                    thumbnailImg.alt = work.title;
                    // thumbnailImg.onclick = () => currentSlide(index + 1);

                    thumbnailImg.onclick = () => {
                        currentSlide(index + 1);
                        thumbnailImg.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    };

                    // columnDiv.appendChild(thumbnailImg);
                    mainSlideRow.appendChild(thumbnailImg);
                

                    slideshowContainer.appendChild(mainSlideRow);
                });


        // Add slideshow functionality
        let slideIndex = 1;
        showSlides(slideIndex);

        function plusSlides(n) {
            showSlides(slideIndex += n);
        }

        function currentSlide(n) {
            showSlides(slideIndex = n);
        }

        function showSlides(n) {
            const slides = document.getElementsByClassName('mainSlideDiv');
            const dots = document.getElementsByClassName('rowSlidecolumnimg');
            // const captionText = document.getElementById('caption');

            if (n > slides.length) { slideIndex = 1; }
            if (n < 1) { slideIndex = slides.length; }

            for (let i = 0; i < slides.length; i++) {
                slides[i].style.display = 'none';
            }
            for (let i = 0; i < dots.length; i++) {
                dots[i].className = dots[i].className.replace(' active', '');
                
            }
           

            slides[slideIndex - 1].style.display = 'block';
            dots[slideIndex - 1].className += ' active';
 
            dots[slideIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

            
            // captionText.innerHTML = dots[slideIndex - 1].alt;
        }
        // End of slideshow functionality

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById('work-detail').classList.remove('hidden');

        // if (!history.state || history.state.section !== 'work-detail' || history.state.workId !== workId) {
        //     history.pushState({section: workIdNum, workId: workIdNum}, '', `#work-${workIdNum}`);
        // }
    }
}
window.showWorkDetail = showWorkDetail;







// Function to display the image full screen with navigation arrows
function openImageFullScreen(imageSrc, index, images) {
    const viewer = document.getElementById('image-viewer') || createImageViewer();
    const img = viewer.querySelector('img');
    img.src = imageSrc;

    // Update navigation arrows
    const prev = viewer.querySelector('.prev');
    const next = viewer.querySelector('.next');
    
    console.log(`Current index: ${index}`); // Debug: Log current index

    prev.onclick = () => {
    
        console.log( (index%images.length) - 1); // Debug: Log action
        if (index > 0) openImageFullScreen(images[(index%images.length) - 1], (index%images.length) - 1, images);
        else openImageFullScreen(images[images.length - 1], images.length - 1, images);
        // if (index > 0)  img.src = images[index - 1];
    };
    next.onclick = () => {
        console.log('Next clicked'); // Debug: Log action
        if (index < images.length - 1) openImageFullScreen(images[index + 1], index + 1, images);
        // if (index < images.length + 1)  img.src = images[index - 1];
    };

    viewer.style.display = 'flex'; // Show the viewer
}

// Function to create the viewer if it doesn't exist
function createImageViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'image-viewer';
    viewer.innerHTML = `
        <div class="prev">&#10094;</div>
        <img src="" alt="Expanded Image">
        <div class="next">&#10095;</div>`;
    document.body.appendChild(viewer);

    // Close viewer on image click
    viewer.addEventListener('click', (e) => {
      
        if (e.target.classList.contains('next') || e.target.classList.contains('prev') ) 
            return;
        if (e.target.tagName !== 'IMG') viewer.style.display = 'none';
    });

    return viewer;
}








