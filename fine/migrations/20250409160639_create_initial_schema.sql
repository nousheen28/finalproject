-- Create users table with accessibility preferences
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  accessibilityPreferences TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create places table for storing location data with accessibility features
CREATE TABLE places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  osmId TEXT,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  placeType TEXT NOT NULL,
  accessibilityFeatures TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved places for users
CREATE TABLE savedPlaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  placeId INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (placeId) REFERENCES places(id)
);

-- Create accessibility reports
CREATE TABLE accessibilityReports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placeId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  reportType TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (placeId) REFERENCES places(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create emergency contacts
CREATE TABLE emergencyContacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create routes history
CREATE TABLE routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  startPointLat REAL NOT NULL,
  startPointLng REAL NOT NULL,
  endPointLat REAL NOT NULL,
  endPointLng REAL NOT NULL,
  waypoints TEXT,
  accessibilityConsiderations TEXT,
  distance REAL,
  duration INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);