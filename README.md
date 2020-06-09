# open_world
Tile based open world multiplayer rpg.
Area files are located in /server/resources/areas and can be edited with Tiled map editor.

This is my free time project and currently I won't be accepting any pull requests but feel free to experiment and learn from this project.

Requirements:
* nodejs v12.13.0 (probably works with older)
* npm
* bcrypt npm package might need C build tools, but it is not currently in use

Deployment:

```
npm install
node ./server/index.js
```

Game starts on `http://localhost` and works with latest Chrome and Firefox on desktop and mobile.

Live demo at https://open-world-game.herokuapp.com/

[Licence ISC](LICENCE.md)
