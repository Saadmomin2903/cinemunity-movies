let page = 1;

document.addEventListener("DOMContentLoaded", async function () {
  const moviesContainer = document.getElementById("movies");
  const nextPageButton = document.getElementById("nextPage");
  const prevPageButton = document.getElementById("prevPage");

  for (let i = 0; i < 20; i++) {
    moviesContainer.innerHTML += SkeletonCard();
  }
  const renderMovies = async () => {
    try {
       
      const allData = await getAllMovies();
      localStorage.clear();
      moviesContainer.innerHTML = "";
      allData.forEach(movie => {
        localStorage.setItem(movie.title, JSON.stringify(movie));
        moviesContainer.innerHTML += MovieCard(movie);
      });
      nextPageButton.disabled = false;
      prevPageButton.disabled = false;
    } catch (error) {
      console.error("Error fetching movies:", error);
      moviesContainer.innerHTML = "<p>Error fetching movies. Please try again later.</p>";
      nextPageButton.disabled = true;
      prevPageButton.disabled = true;
    }
  };

  await renderMovies();

  nextPageButton.addEventListener("click", async () => {
    page++;
    await renderMovies();
    window.scrollTo(0, 0);
  });

  prevPageButton.addEventListener("click", async () => {
    if (page === 1) {
      return;
    }
    page--;
    await renderMovies();
    window.scrollTo(0, 0);
  });
});

const getAllMovies = async () => {
  const allData = [];

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=aab044a8c8a395ff28b777d2c0f890b1&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}`
  );
  const movies = await res.json();

  if (!movies.results || movies.results.length === 0) {
    throw new Error("No movies found");
  }

  movies.results.forEach(movie => {
    allData.push({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      popularity: movie.popularity,
      vote_average: movie.vote_average,
    });
  });

  return allData;
};

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


const SkeletonCard = () => {
    return `
        <div class="bg-white rounded-lg border p-4 m-4 w-64">
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