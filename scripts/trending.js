let page = 1;

document.addEventListener("DOMContentLoaded", async function () {
  const moviesContainer = document.getElementById("movies");

  const renderMovies = async () => {
    try {
       
      const allData = await getAllMovies();
      localStorage.clear();
      moviesContainer.innerHTML = "";
      allData.forEach(movie => {
        localStorage.setItem(movie.title, JSON.stringify(movie));
        moviesContainer.innerHTML += MovieCard(movie);
      });
    } catch (error) {
      console.error("Error fetching movies:", error);
      moviesContainer.innerHTML = "<p>Error fetching movies. Please try again later.</p>";
      nextPageButton.disabled = true;
      prevPageButton.disabled = true;
    }
  };

  await renderMovies();
});

const getAllMovies = async () => {
  const allData = [];
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYWIwNDRhOGM4YTM5NWZmMjhiNzc3ZDJjMGY4OTBiMSIsInN1YiI6IjY2MzIyNzJhYzM5MjY2MDEyOTZkMGUwYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1I-t6H1Iy8BOUZ_14U-uC-QeZCsG0JOxB8l6axB2yXQ'
    }
  };

  const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?language=en-US'`, options);
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

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("movie-title")) {
    console.log(e.target.textContent);
    window.location.href = `/pages/details.html?title=${e.target.textContent}`;
  }
});