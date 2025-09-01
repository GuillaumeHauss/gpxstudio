const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

const Trace = sequelize.define('Trace', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Track = sequelize.define('Track', {
  name: {
    type: DataTypes.STRING,
  },
});

const Segment = sequelize.define('Segment', {
  // No specific fields, just serves as a container for points
});

const Point = sequelize.define('Point', {
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  ele: DataTypes.FLOAT,
  time: DataTypes.DATE,
  hr: DataTypes.INTEGER,
  cad: DataTypes.INTEGER,
  atemp: DataTypes.FLOAT,
  power: DataTypes.INTEGER,
  surface: DataTypes.STRING,
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Waypoint = sequelize.define('Waypoint', {
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  ele: DataTypes.FLOAT,
  name: DataTypes.STRING,
  cmt: DataTypes.STRING,
  desc: DataTypes.STRING,
  sym: DataTypes.STRING,
});

const Folder = sequelize.define('Folder', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Associations
User.hasMany(Trace);
Trace.belongsTo(User);

Trace.hasMany(Track, { onDelete: 'CASCADE', hooks: true });
Track.belongsTo(Trace);

Trace.hasMany(Waypoint, { onDelete: 'CASCADE', hooks: true });
Waypoint.belongsTo(Trace);

Track.hasMany(Segment, { onDelete: 'CASCADE', hooks: true });
Segment.belongsTo(Track);

Segment.hasMany(Point, { onDelete: 'CASCADE', hooks: true });
Point.belongsTo(Segment);

User.hasMany(Folder);
Folder.belongsTo(User);

Folder.hasMany(Trace);
Trace.belongsTo(Folder);

module.exports = {
  sequelize,
  User,
  Trace,
  Track,
  Segment,
  Point,
  Waypoint,
  Folder,
};
