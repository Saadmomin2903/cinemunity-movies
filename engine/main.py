import modal
from modal import Stub, web_endpoint, Image, Secret
import os
import asyncio
import aiohttp
from typing import Dict, List
import logging
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import requests
from fastapi import FastAPI, HTTPException

logging.basicConfig(level=logging.INFO)

image = modal.Image.debian_slim(python_version="3.10").run_commands(
    "pip install pandas",
    "pip install scikit-learn",
    "pip install requests",
    "pip install aiohttp",
    "pip install fastapi",  # Added this line to install FastAPI
)
stub = Stub(name="movie", image=image)

# Add a timeout to prevent requests from hanging indefinitely
TIMEOUT = aiohttp.ClientTimeout(total=60)  # 60 seconds

@stub.function(secrets=[modal.Secret.from_name("tmdb_key")])
@web_endpoint(label="all", method="POST")
async def fetch_all_movies() -> List[Dict]:
    BASE_URL = "https://api.themoviedb.org/3"
    MAX_PAGES = 500
    endpoint = "/discover/movie"
    params = {
        "api_key": os.environ["tmdb_key"],
        "language": "en-US",
        "sort_by": "popularity.desc",
        "include_adult": "false",
        "include_video": "false",
        "page": 1,
    }
    all_movies = []

    async with aiohttp.ClientSession(timeout=TIMEOUT) as session:
        while True:
            try:
                async with session.get(BASE_URL + endpoint, params=params) as response:
                    response.raise_for_status()  # Raise an exception for non-2xx status codes
                    data = await response.json()
                    if "results" in data:
                        all_movies.extend(data["results"])
                        if data["page"] < data["total_pages"] and params["page"] < MAX_PAGES:
                            params["page"] += 1
                        else:
                            break
                    else:
                        logging.error(f"Unexpected response format: {data}")
                        break
            except aiohttp.ClientError as e:
                logging.error(f"Error fetching movies: {e}")
                break
            except Exception as e:
                logging.error(f"Unexpected error: {e}")
                break

    return all_movies

@stub.function()
@web_endpoint(label="reco", method="POST" )
async def get_reco(data: Dict ):
    title = data.get('title')
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    try:
        # Fetch all movies data
        all_movies_response = requests.post("https://saadmomin2903--all.modal.run/")
        all_movies_data = all_movies_response.json()

        df = pd.DataFrame(all_movies_data)
        if 'overview' not in df.columns:
            raise HTTPException(status_code=500, detail="Overview column missing in dataset")
 
        df["overview"] = df["overview"].fillna("")
        genre_map = {
        28: "Action",
        12: "Adventure",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        14: "Fantasy",
        36: "History",
        27: "Horror",
        10402: "Music",
        9648: "Mystery",
        10749: "Romance",
        878: "Science Fiction",
        10770: "TV Movie",
        53: "Thriller",
        10752: "War",
        37: "Western",
        10759: "Action & Adventure",
        10762: "Kids",
        10763: "News",
        10764: "Reality",
        10765: "Sci-Fi & Fantasy",
        10766: "Soap",
        10767: "Talk",
        10768: "War & Politics"
        }
        def map_genres(genre_ids):
         return ' '.join([genre_map.get(genre_id, '') for genre_id in genre_ids])
        
        df['genres'] = df['genre_ids'].apply(map_genres)

        tfidf = TfidfVectorizer(stop_words="english")
        tfidf_matrix = tfidf.fit_transform(df["overview"])
        cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
        indices = pd.Series(df.index, index=df["title"]).drop_duplicates()

        if len(title.split()) == 1:
            matched_movies = [movie for movie in all_movies_data if title.lower() in movie["title"].lower()]
            if not matched_movies:
                raise HTTPException(status_code=404, detail="No matching movies found")
            recommended_movies = [movie["title"] for movie in matched_movies]
        else:
            if title not in indices:
                raise HTTPException(status_code=404, detail="Movie not found")
            idx = indices[title]
            sim_scores = list(enumerate(cosine_sim[idx]))  # Convert sim_scores to a list
            sim_scores_with_index = sorted(sim_scores, key=lambda x: x[1], reverse=True)  # Sort the list based on similarity scores
            sim_scores_with_index = sim_scores_with_index[1:16]  # Adjust the slicing to include the 100th index
            movie_indices = [i[0] for i in sim_scores_with_index]
            recommended_movies = [all_movies_data[i]["title"] for i in movie_indices]

        return {"recommendations": recommended_movies}

    except Exception as e:
        logging.error(f"Error getting recommendations: {e}")
        return {"recommendations":[]}