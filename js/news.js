const app = require('express').Router();
const IPFS = require('ipfs-api');
const Node = require('ipfs');
const OrbitDB = require('orbit-db');
const Express = require('express');
const Util = require('./util.js');

app.use(Express.urlencoded());

// var node = new Node({
//     repo: 'ipfs/node2',
//     start: true,
//     EXPERIMENTAL: {
//       pubsub: true
//     },
//     config: {
//       Addresses: {
//         Swarm: [
//           '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
//         ]
//       }
//     }
//   });
//   var orbitdb;
//   var db;
//   const stimulusArticles = '/orbitdb/QmRffsUeGdDSms5EiqYNw69NCggegk5FutEujJ3yLT5FJd/stimulus-articles';
//   node.on('ready', async () => {
//       console.log("Node ready")
//       orbitdb = new OrbitDB(node);
//       const access = {
//         write: ['*'],
//         sync: true,
//       }
//       db = await orbitdb.docstore(stimulusArticles, access);
//       await db.load();
//       //     , {
//       //     create: true,
//       //     overwrite: true,
//       //     write: ['*'],
//       // });
//       console.log("DB2: "+db.address.toString())
//       console.log("DB connected...");
// });

const articlesDbName = 'stimulus-articles'

var db = Util.getDB();
var dbuser = Util.getUserDB();
// console.log("Got: ");

app.get('/:authorHash', (req, res) => {
    //Get all the articles written by the author
    const authorHash = req.params.authorHash.toLowerCase();
    const order = req.query.order;
    var mined = req.query.mined;
    // orbitdb.docstore(articlesDbName).then((db) => {
    //     console.log(db.query((doc) => doc.author == authorHash))
    // });

    // const all = db.query((doc) => doc.author = authorHash);
    mined = (mined == "true");
    const all = db.query((doc) => {
      if(doc.author == undefined)
        return false;
      return (doc.author == authorHash && doc.Mined == mined);
    });

    console.log("Hash: "+authorHash);
    
    // console.log(db.query(e => true));
    console.log("Author res: "+JSON.stringify(all));
    res.send(200, {news: all});

});


app.post('/getNews', (req, res) => {
  const phrase = req.body.phrase;
  const signature = req.body.sign;
  var mined = req.body.mined;
  
  const user = Util.getAddressFromSig(signature, phrase);
  console.log(user);
  var subscriptions = dbuser.get(user)[0].channel;
  console.log(subscriptions);
  var newsArticles;
  mined = (mined == "true");
  for(var i = 0; i < subscriptions.length; i++) {
    newsArticles = db.query((doc) => {
      // console.log(subscriptions[i].toLowerCase())
      // console.log("Author: "+doc.author);
      // console.log(mined);
      if(doc.author == undefined)
        return false;
      return (doc.author == subscriptions[i].toLowerCase() && doc.Mined == mined);
    });
  }
  res.send(200, {news: newsArticles});
});

app.get('/search/:keyword', (req, res) => {
  const keyword = req.params.keyword.toLowerCase();
  const matchedArticles = db.query((doc) => {
    console.log(doc.title);
    if(doc.title == undefined)
      return false
    return doc.title.toLowerCase().includes(keyword);
  });
  res.send(200, {news: matchedArticles});
});


app.get('/users/search/:keyword', (req, res) => {
  const keyword = req.params.keyword.toLowerCase();
  const matchedArticles = dbuser.query((doc) => {
    console.log(doc.name);
    if(doc.name == undefined)
      return false
    return doc.name.toLowerCase().includes(keyword);
  });
  res.send(200, {users: matchedArticles});
});


module.exports = app;