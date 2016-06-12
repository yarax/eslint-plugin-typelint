const db = {}; // mock db

function getActors(movieId) {
  return db.findOne({ _id: movieId }).then(
    /**
     * @param movie <movie>
     */
    (movie) => {
      return movie.actors;
    });
}

module.exports = getActors;