# PowerPoint video player

Provide a little script that, given a video generated by powerpoint, uses `ffmpeg` to figure out when annimations take place, and generates a HTML5 video player preconfigured to play animations sequentially.

## Usage

Install [`nodejs`](https://nodejs.org/en/), add execution permission for `ppvid2html.js` (`chmod +x ppvid2html.js`), and run:

```
/path/to/ppvid2html.js INPUT.mp4
```

(or call `node /path/to/ppvid2html.js INPUT.mp4`)

### Skipping frames
If some animation at step `i` (current step is visible in hash of URL) was supposed to run in one and gets split in `n` parts, you can fix it by running:

```
/path/to/ppvid2html.js INPUT.mp4 i-n
```

