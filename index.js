const fs = require('fs');
const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const yts = require('yt-search');
const jsonp = require('jsonp');

const youtubesearchapi = require('youtube-search-api');

const ytdl2 = require('@distube/ytdl-core');

const axios = require('axios');
const jsonpAdapter = require('axios-jsonp');

const app = express();

app.use(cors());

let video;

app.get('/download', (req, res) => {
  const url = req.query.url;
  const format = req.query.format;
  const quality = req.query.quality;
  video = ytdl(url, {
    format: format,
    quality: quality,
  }).pipe(res);
});

app.get('/download-save', (req, res) => {
  const videoUrl = 'https://www.youtube.com/watch?v=lvs68OKOquM';
  const filePath = 'video.mp4';

  // Download and save video file to the server
  ytdl2(videoUrl, { quality: 'lowest' })
    .pipe(fs.createWriteStream(filePath))
    .on('finish', () => {
      // Send download link to the client
      res.json({ downloadLink: `http://localhost:4000/download-file` });
    });
});

// Endpoint to serve the downloaded file
app.get('/download-file', (req, res) => {
  const filePath = 'video.mp4';

  // Use res.download to send the file and delete it afterward
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error occurred');
    } else {
      // File sent successfully, delete it from the server
      // fs.unlink(filePath, (unlinkErr) => {
      //   if (unlinkErr) {
      //     console.error('Error deleting file:', unlinkErr);
      //   } else {
      //     console.log('File deleted successfully');
      //   }
      // });
    }
  });
});

// app.get('/download-save', (req, res) => {
//   ytdl('https://www.youtube.com/watch?v=lvs68OKOquM', {
//     quality: 'lowest',
//   }).pipe(fs.createWriteStream('video.mp4'));
// });

app.get('/download-save-alternative', (req, res) => {
  ytdl2('https://www.youtube.com/watch?v=Q_oBBxPADd8', {
    itag: '18',
    // filter: (format) => format.container === 'videoonly',
  }).pipe(
    require('fs')
      .createWriteStream('video.mp4')
      .on('finish', () => {
        console.log('finish');
        res.send('Downloaded');
      })
      .on('close', (err) => {
        console.log('close');
      })
  );
  // .end(() => {
  //   console.log('end');
  // });

  // // Get video info
  // ytdl2
  //   .getBasicInfo('https://www.youtube.com/watch?v=rSso1Z-7ct0')
  //   .then((info) => {
  //     console.log(info.videoDetails.title);
  //   });

  // // Get video info with download formats
  // ytdl2.getInfo('https://www.youtube.com/watch?v=rSso1Z-7ct0').then((info) => {
  //   console.log(info.formats);
  // });

  const fs = require('fs');

  // Create a writable stream
  const writeStream = fs.createWriteStream('output.txt');

  // Write data to the stream
  writeStream.write('Hello, world!\n');
  writeStream.write('Writing data to a file using createWriteStream.\n');

  // End the stream (this closes the file)
  // writeStream.end('Final data', 'utf8', () => {
  //   console.log('Stream ended');
  // });

  writeStream.close();
  writeStream.on('finish', () => {
    console.log('All data written and stream closed');
  });

  writeStream.on('error', (err) => {
    console.error('Error writing to stream:', err);
  });

  writeStream.on('close', () => {
    console.log('File descriptor closed');
  });
});

app.get('/search', (req, res) => {
  const query = req.query.query;
  const pages = req.query.pages;
  yts({ pages: 20, pageStart: 10, pageEnd: 20, query, search: query }).then(
    (info) => {
      res.send(info.videos);
    }
  );
});

// Ensure that the 'google' and 'ac' objects exist on the 'window' object
// window.google = window?.google || {};
// window.google.ac = window?.google.ac || {};

// // Define the 'h' function within 'window.google.ac'
// window.google.ac.h = function (response) {
//   // Handle the JSONP response here
//   console.log('Received JSONP response:', response);

//   // Extract suggestions if it's in the expected format
//   if (Array.isArray(response) && response[1]) {
//     const suggestions = response[1].map((item) => item[0]);
//     console.log('Suggestions:', suggestions);
//     return suggestions;
//   } else {
//     console.error('Unexpected response format');
//     return [];
//   }
// };

app.get('/search-yt', (req, response) => {
  // jsonp(
  //   `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=vn&gs_rn=64&gs_ri=youtube&ds=yt&q=${req.query.q}`,
  //   null,
  //   function (err, data) {
  //     if (err) {
  //       console.error(err.message);
  //     } else {
  //       console.log(data);
  //     }
  //   }
  // );

  axios({
    url: `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=vn&gs_rn=64&gs_ri=youtube&ds=yt&q=${req.query.q}`,
    // adapter: jsonpAdapter,
    // callbackParamName: 'test', // optional, 'callback' by default
  }).then((res) => {
    const regex = /window\.google\.ac\.h\(\["[^"]+",\s*(\[\[.*\]\])/s;
    const match = res.data.match(regex);

    if (match) {
      const dataString = match[1];
      console.log(dataString);
      const dataArray = JSON.parse(dataString);
      console.log('Extracted data array at index 1:', dataArray);
      const result = dataArray.map((item) => item[0]);
      response.send(result);
    } else {
      console.error('No match found');
    }
  });
  // res.send('Hello world');
});

app.get('/search-yt-pkg', async (req, res) => {
  const isNext = req.query.next;
  const nextPageToken = req.query.nextPageToken;

  if (isNext) {
    const nextPageResult = await youtubesearchapi.NextPage(
      nextPageToken,
      false
    );

    return res.send(nextPageResult);
  }

  const result = await youtubesearchapi.GetListByKeyword(
    req.query.q,
    false,
    10
  );

  res.send(result);
});

const port = 4000;

const start = () => {
  app.listen(port, () => {
    console.log(`Server started on port ${port}....`);
  });
};
start();
