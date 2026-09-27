"use strict";
/*
 * Retired RC8 compatibility slot.
 *
 * RC8 shipped an early KantoMap implementation here and later replaced the
 * the same public Kanto map global with src/journey/kanto-map.js before the app
 * became interactive. The early implementation had no durable side effects:
 * it only declared local helpers and assigned the shadowed global.
 *
 * Keep this source slot temporarily so the recovered script ordering remains
 * stable while the canonical map implementation lives exclusively in
 * src/journey/kanto-map.js. Do not add behavior here.
 */
