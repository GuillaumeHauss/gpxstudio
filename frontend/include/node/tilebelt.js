'use strict';

// Tilebelt module extracted from bundle.js
const d2r = Math.PI / 180;
const r2d = 180 / Math.PI;

function tileToBBOX(tile) {
    const e = tile2lon(tile[0] + 1, tile[2]);
    const w = tile2lon(tile[0], tile[2]);
    const s = tile2lat(tile[1] + 1, tile[2]);
    const n = tile2lat(tile[1], tile[2]);
    return [w, s, e, n];
}

function tileToGeoJSON(tile) {
    const bbox = tileToBBOX(tile);
    return {
        type: 'Polygon',
        coordinates: [[
            [bbox[0], bbox[3]],
            [bbox[0], bbox[1]],
            [bbox[2], bbox[1]],
            [bbox[2], bbox[3]],
            [bbox[0], bbox[3]]
        ]]
    };
}

function tile2lon(x, z) {
    return x / Math.pow(2, z) * 360 - 180;
}

function tile2lat(y, z) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function pointToTile(lon, lat, z) {
    const tile = pointToTileFraction(lon, lat, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
}

function getChildren(tile) {
    return [
        [tile[0] * 2, tile[1] * 2, tile[2] + 1],
        [tile[0] * 2 + 1, tile[1] * 2, tile[2] + 1],
        [tile[0] * 2 + 1, tile[1] * 2 + 1, tile[2] + 1],
        [tile[0] * 2, tile[1] * 2 + 1, tile[2] + 1]
    ];
}

function getParent(tile) {
    return [tile[0] >> 1, tile[1] >> 1, tile[2] - 1];
}

function getSiblings(tile) {
    return getChildren(getParent(tile));
}

function hasTile(tiles, tile) {
    for (let i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) return true;
    }
    return false;
}

function hasSiblings(tile, tiles) {
    const siblings = getSiblings(tile);
    for (let i = 0; i < siblings.length; i++) {
        if (!hasTile(tiles, siblings[i])) return false;
    }
    return true;
}

function tilesEqual(tile1, tile2) {
    return (
        tile1[0] === tile2[0] &&
        tile1[1] === tile2[1] &&
        tile1[2] === tile2[2]
    );
}

function tileToQuadkey(tile) {
    let index = '';
    for (let z = tile[2]; z > 0; z--) {
        let b = 0;
        const mask = 1 << (z - 1);
        if ((tile[0] & mask) !== 0) b++;
        if ((tile[1] & mask) !== 0) b += 2;
        index += b.toString();
    }
    return index;
}

function quadkeyToTile(quadkey) {
    let x = 0;
    let y = 0;
    const z = quadkey.length;
    for (let i = z; i > 0; i--) {
        const mask = 1 << (i - 1);
        const q = +quadkey[z - i];
        if (q === 1) x |= mask;
        if (q === 2) y |= mask;
        if (q === 3) {
            x |= mask;
            y |= mask;
        }
    }
    return [x, y, z];
}

function bboxToTile(bboxCoords) {
    const min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
    const max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
    const bbox = [min[0], min[1], max[0], max[1]];
    const z = getBboxZoom(bbox);
    if (z === 0) return [0, 0, 0];
    const x = bbox[0] >>> (32 - z);
    const y = bbox[1] >>> (32 - z);
    return [x, y, z];
}

function getBboxZoom(bbox) {
    const MAX_ZOOM = 28;
    for (let z = 0; z < MAX_ZOOM; z++) {
        const mask = 1 << (32 - (z + 1));
        if (((bbox[0] & mask) !== (bbox[2] & mask)) ||
            ((bbox[1] & mask) !== (bbox[3] & mask))) {
            return z;
        }
    }
    return MAX_ZOOM;
}

function pointToTileFraction(lon, lat, z) {
    const sin = Math.sin(lat * d2r);
    const z2 = Math.pow(2, z);
    let x = z2 * (lon / 360 + 0.5);
    let y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    x = x % z2;
    if (x < 0) x = x + z2;
    return [x, y, z];
}

export {
    tileToGeoJSON,
    tileToBBOX,
    getChildren,
    getParent,
    getSiblings,
    hasTile,
    hasSiblings,
    tilesEqual,
    tileToQuadkey,
    quadkeyToTile,
    pointToTile,
    bboxToTile,
    pointToTileFraction
};
