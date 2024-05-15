window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieTitle = urlParams.get("title");

  console.log(movieTitle);

  if (movieTitle) {
    const detailsContainer = document.getElementById("movie-details");

    const movieDetails = localStorage.getItem(movieTitle);

    const movie = JSON.parse(movieDetails);

    if (movie) {
      detailsContainer.innerHTML = `
      <div class="relative">
        <div class="absolute inset-0 z-0">
          <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover opacity-50 filter blur-lg">
        </div>
        <div class="relative z-10 border-0  flex flex-col md:flex-row gap-10 p-10">
          <div class="w-full max-w-[350px]">
            <img src="${movie.poster}" alt="${movie.title}" class="w-full shadow-[0px_0px_20px_black] shadow-black h-auto w-[350px] rounded-lg">
          </div>
          <div class="w-full">
            <div class="p-3 rounded-lg bg-zinc-950/85 shadow-[0px_0px_20px_black] border border-zinc-950/20 text-white">
              <h2 class="text-4xl font-bold mb-4">${movie.title}</h2>
              <p class="text-lg mb-4 text-zinc-100">${movie.overview}</p>
            </div>
            
            <div class="bg-zinc-950/85 border shadow-[0px_0px_20px_black] border-zinc-950/20 mt-5 text-white p-2 rounded-full w-[180px]">
              <span class="font-semibold">Popularity:</span> ${movie.popularity}
            </div>
            <div class="bg-zinc-950/85 border shadow-[0px_0px_20px_black] border-zinc-950/20 text-white p-2 rounded-full w-[180px] mt-5">
              <span class="font-semibold">Rating:</span> ${movie.vote_average}
            </div>
          </div>
        </div>
      </div>
      `;

      const recoContainer = document.getElementById("reco");

      for (let i = 0; i < 10; i++) {
        recoContainer.innerHTML += SkeletonCard();
      }
      try {
        const res = await fetch("https://saadmomin2903--reco.modal.run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: movieTitle }),
        });

        const data = await res.json();
        const recommendations = data.recommendations;

        const recoData = new Map();
        for (let movie of recommendations) {
          let res = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
              movie
            )}&include_adult=false&language=en-US&page=1`,
            {
              headers: {
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYWIwNDRhOGM4YTM5NWZmMjhiNzc3ZDJjMGY4OTBiMSIsInN1YiI6IjY2MzIyNzJhYzM5MjY2MDEyOTZkMGUwYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1I-t6H1Iy8BOUZ_14U-uC-QeZCsG0JOxB8l6axB2yXQ",
              },
              cache: "force-cache",
            }
          );

          const response = await res.json();
          if (response.results && response.results.length > 0) {
            const movieData = response.results[0];
            if (movieData.title !== movieTitle) {
              recoData.set(movieData.id, {
                id: movieData.id,
                title: movieData.title,
                overview: movieData.overview,
                poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                popularity: movieData.popularity,
                vote_average: movieData.vote_average,
              });
            }
          }
        }

        console.log(recoData);

        const arrData = Array.from(recoData.values());
        recoContainer.innerHTML = "";

        if (arrData.length < 1) {
          recoContainer.innerHTML += `<div class="w-full h-[300px] rounded-md bg-zinc-900 p-5 flex justify-center items-center"><h1 class="text-3xl font-semibold text-zinc-400">No recommendations :(</h1></div>`;
        }
        arrData.forEach((movie) => {
          localStorage.setItem(movie.title, JSON.stringify(movie));
          recoContainer.innerHTML += MovieCard(movie);
        });
 
const reviewContainer = document.getElementById("reviews");

        reviewContainer.innerHTML = `<div class="w-full h-[300px] rounded-md bg-zinc-900 p-5 flex justify-center items-center"><h1 class="text-3xl font-semibold text-zinc-400">Loding reviews...</h1></div>`;
        const r = await fetch('https://saadmomin2903--reviews.modal.run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: movieTitle,
            movie_id: movie.id
          }),
          cache: "force-cache"
        });

        const reviews = await r.json();

        

        reviewContainer.innerHTML = "";
        if(reviews.length > 0) {
           reviews.forEach((review) => {
                reviewContainer.innerHTML += ReviewComponent(review)
           })
        }else{
          reviewContainer.innerHTML="";
          reviewContainer.innerHTML+= `<div class="w-full h-[300px] rounded-md bg-zinc-900 p-5 flex justify-center items-center"><h1 class="text-3xl font-semibold text-zinc-400">No reviews :(</h1></div>`;
        }


        console.log(reviews);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        // detailsContainer.innerHTML += "<p>Error fetching movie details.</p>";
      }
    } else {
      detailsContainer.innerHTML += "<p>No movie details found.</p>";
    }
  } else {
    const detailsContainer = document.getElementById("movie-details");
    detailsContainer.innerHTML = "<p>No movie title provided in the URL.</p>";
  }
});

const MovieCard = (movie) => {
  return `
      <div class="bg-zinc-950 text-white rounded-lg border border-zinc-800 p-4 m-4 w-64">
        <div class="overflow-hidden rounded-lg">
          <img class="rounded-lg w-full h-80 object-cover hover:scale-110 transition-all duration-300" src="${movie.poster}" alt="${movie.title}">
        </div>
        <div class="mt-4">
          <p class="text-xl hover:text-blue-600 cursor-pointer font-semibold movie-title">${movie.title}</p>
          <div class="mt-2 text-zinc-300">
            <span class="block">Popularity: ${movie.popularity}</span>
            <span class="block">Rating: ${movie.vote_average}</span>
          </div>
        </div>
      </div>
    `;
};

const ReviewComponent = (review) => {
  return `
    <div class="bg-zinc-950 text-white rounded-lg border border-zinc-800 p-4 m-4">
      <h2 class="text-xl font-semibold ${review.sentiment==='Positive' ? 'text-green-600' : 'text-red-600'}">${review.author}</h2>
      <div class="mt-2">
        <p class="text-sm"><strong>Author Details:</strong></p>
        <p class="text-sm">Name: ${review.author_details.name}</p>
        <p class="text-sm">Username: ${review.author_details.username}</p>
        <p class="text-sm">Rating: ${review.author_details.rating}</p>
      </div>
      <div class="mt-4">
        <p class="text-sm leading-7">${review.content.replace(/\\r\\n/g, '<br>')}</p>
      </div>
      <div class="mt-4">
        <p class="text-sm">Created At: ${new Date(review.created_at).toLocaleString()}</p>
        <p class="text-sm">Updated At: ${new Date(review.updated_at).toLocaleString()}</p>
        <p class="text-sm">Review URL: <a class="text-blue-500 hover:text-blue-700" href="${review.url}" target="_blank" rel="noopener noreferrer">${review.url}</a></p>
      </div>
    </div>
  `;
};

const SkeletonCard = () => {
  return `
        <div class=" rounded-lg border border-zinc-800 bg-zinc-950 p-4 m-4 w-64">
          <div class="overflow-hidden h-80 skl rounded-lg">
          </div>
          <div class="mt-4">
            <p class="text-xl hover:text-blue-600 cursor-pointer font-semibold movie-title"></p>
            <div class="mt-2 flex flex-col gap-5 text-gray-700">
              <span class="block h-10 skl rounded-xl"></span>
              <span class="block h-10 skl rounded-xl"></span>
            </div>
          </div>
        </div>
      `;
};

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("movie-title")) {
    console.log(e.target.textContent);
    window.location.href = `/pages/details.html?title=${e.target.textContent}`;
  }
});
