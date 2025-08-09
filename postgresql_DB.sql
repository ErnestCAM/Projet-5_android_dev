-- PostgreSQL Database: redstar

-- Drop tables if exist
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS films CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- === Table: films ===

CREATE TABLE films (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(255),
  annee_sortie SMALLINT,
  langue_originale VARCHAR(100),
  pays_productions VARCHAR(255),
  acteurs TEXT,
  realisateurs VARCHAR(255),
  available_copies INTEGER NOT NULL DEFAULT 1,
  imgPath VARCHAR(500),
  trailer VARCHAR(500)
);

-- === Table: users ===

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  token VARCHAR(512),
  date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- === Table: rentals ===

CREATE TABLE rentals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  film_id INTEGER NOT NULL,
  rental_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  return_date TIMESTAMP,
  retour_quantite INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (film_id) REFERENCES films(id)
);

-- === Insert data into films ===

INSERT INTO films (title, genre, annee_sortie, langue_originale, pays_productions, acteurs, realisateurs, available_copies, imgPath, trailer) VALUES
('Teenage Mutant Ninja Turtles', 'Action, Adventure, Comedy, Crime, Drama, Family, Sci-Fi', 1990, 'English', 'Hong Kong, USA', 'Brian Tochi, Corey Feldman, David Forman, Elias Koteas, James Saito, Josh Pais, Judith Hoag, Kevin Clash, Leif Tilden, Michael Turney, Michelan Sisti, Robbie Rist, Toshirô Obata', 'Steve Barron', 5, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/zxkqixUKZt8?si=rzuudzSmM9n9AZm9'),
('Fast & Furious', 'Action, Crime, Drama, Thriller', 2009, 'English', 'USA', 'Vin Diesel, Paul Walker, Jordana Brewster, Michelle Rodriguez, John Ortiz, Laz Alonso, Gal Gadot', 'Justin Lin', 3, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/k98tBkRsGl4?si=JR7psyc-ZOoD4Ldo'),
('Hook', 'Adventure, Family, Fantasy', 1991, 'English', 'USA', 'Robin Williams, Dustin Hoffman, Julia Roberts, Bob Hoskins, Maggie Smith', 'Steven Spielberg', 2, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/c-vwgt8cwEM?si=KQ8X6bNXGZVgK9AO'),
('Sister Act', 'Comedy, Crime, Music', 1992, 'English', 'USA', 'Whoopi Goldberg, Maggie Smith, Harvey Keitel, Kathy Najimy, Wendy Makkena', 'Emile Ardolino', 4, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/lCBjHkCK1Vw?si=ZAAVGVW1VAs6U9Rg'),
('Schindler''s List', 'Biography, Drama, History, War', 1993, 'English', 'USA', 'Liam Neeson, Ben Kingsley, Ralph Fiennes, Caroline Goodall, Embeth Davidtz', 'Steven Spielberg', 1, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/gG22XNhtnoY?si=aAS5RRz0fZv--5s3'),
('Twilight', 'Drama, Fantasy, Romance', 2008, 'English', 'USA', 'Kristen Stewart, Robert Pattinson, Taylor Lautner, Billy Burke, Ashley Greene, Kellan Lutz, Nikki Reed', 'Catherine Hardwicke', 3, 'https://www.google.com/imgres?...', 'https://www.youtube.com/embed/uxjNDE2fMjI?si=9bYvNwKcaxUhcuIp'),
('Léon', 'Crime, Thriller', 1994, 'English', 'France', 'Jean Reno, Natalie Portman, Gary Oldman, Danny Aiello, Peter Appel', 'Luc Besson', 2, 'https://www.google.com/imgres?...', 'https://www.youtube.com/embed/rNw0D7Hh0DY?si=NVeg7NrABBhRNK5u'),
('Pulp Fiction', 'Crime, Thriller', 1994, 'English', 'USA', 'John Travolta, Samuel L. Jackson, Uma Thurman, Bruce Willis, Ving Rhames', 'Quentin Tarantino', 4, 'https://www.google.com/url?...', 'https://www.youtube.com/embed/s7EdQ4FqbhY?si=ycR7ZFTr0pMRI4ie'),
('True Lies', 'Action, Comedy, Romance, Thriller', 1994, 'English', 'USA', 'Arnold Schwarzenegger, Jamie Lee Curtis, Tom Arnold, Bill Paxton, Tia Carrere', 'James Cameron', 3, 'https://www.google.com/imgres?...', 'https://www.youtube.com/embed/3B7HG8_xbDw?si=QWU3QXWfIJ_2y9fm');

-- === Insert data into users ===

INSERT INTO users (name, email, password, token, date_inscription) VALUES
('Brian Kean', 'bkean@gmail.com', '$2b$10$4INg1ULecvWog2BBFiKfr.p4W3l685QpuKCuOj6XdMV0ys4001ODW', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQ1Njk5MTYxLCJleHAiOjE3NDgyOTExNjF9._uYWMSOrmnfn7p72Di_8w3o4FuR0Xe1nCMsvab-I71Q', '2025-04-25 21:41:41');

-- === Insert data into rentals ===

INSERT INTO rentals (user_id, film_id, rental_date, return_date, retour_quantite) VALUES
(1, 1, '2025-04-25 17:48:28', '2025-04-26 16:32:16', 0);
