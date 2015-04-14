
var express = require('express');
var ejs = require('ejs'); 
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var methodOverride = require('method-Override');

var app = express();
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({extended:false}));
app.use(methodOverride('_method'));

var db = new sqlite3.Database('entries.db');

db.serialize(function() {
     db.run("CREATE TABLE if NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, giphy TEXT);");
     db.run("CREATE TABLE if NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, note TEXT, entry_Id INTEGER);");
});

//show list of blog post 
app.get ('/',function(req, res){
	res.redirect('/entries');
});

app.get('/entries', function (req, res){
	db.all("SELECT * FROM entries;", function(err, rows){
		if(err){
			throw err;
		}else{ 
		res.render('index.ejs', {entries:rows});
		}
	});
});

// create a new post 
app.get('/entries/new',function(req,res){
	res.render("new.ejs");
});

// show the individual entry 
app.get("/entries/:id",function(req, res){
	var entryID = parseInt(req.params.id);
	db.get("SELECT * FROM entries WHERE id = ?", entryID, function (err, row){ 
		if(err){ throw err;}
		db.all("SELECT comments.user, comments.note, comments.id FROM comments INNER JOIN entries ON comments.entry_Id = entries.id WHERE entries.id = "+entryID, function(err, data){ 
			if(err){ throw err; }
				res.render('show.ejs',{entry:row, comments:data});

		});
	});
});

// posting a new entries from filled content 
app.post('/entries',function(req,res){
	request('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=' +req.body.giphy, function(err, response, body){if(err){ throw err; }
		var giphy = JSON.parse(body).data.image_url; 

		db.run("INSERT INTO entries (title, content, giphy) VALUES (?,?,?)", req.body.title, req.body.content, giphy,function(err){ 
				if (err){throw err; }
				res.redirect('/entries');
			});
	});
});

//posting comments to the selected entry 
app.post('/entries/:id/comments', function(req, res){
	var entryID = parseInt(req.params.id); 
	db.run("INSERT INTO comments (user, note, entry_Id) VALUES(?,?,?)", req.body.user, req.body.note, entryID, function(err){
		if(err){throw err; }
		res.redirect('/entries/' + entryID);
	});
});

//render edit page for user updates  
app.get('/entries/:id/edit',function(req,res){
	var entryID = parseInt(req.params.id);
	db.get("SELECT * FROM entries WHERE id = ?", entryID, function (err, row){ 
		if(err){ throw err;
		}else{ 
		res.render('edit.ejs',{entry:row});
		}
	});
});
//update an entry 
app.put("/entries/:id",function(req, res){

	if( req.body.giphy != ""){
		request('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=' +req.body.giphy, function(err, response, body){ if(err){ throw err; }
			var giphy = JSON.parse(body).data.image_url; 
			db.run("UPDATE entries SET title = ?, content = ?, giphy = ? WHERE id = ?", req.body.title, req.body.content, giphy, parseInt(req.params.id), function(err){
				if (err){
					throw err; 
				}else{
					//return to article page to see changes 
					res.redirect('/entries/'+ parseInt(req.params.id));
				}
			});
		});
	}else{ 
		db.run("UPDATE entries SET title = ?, content = ? WHERE id = ?", req.body.title, req.body.content, parseInt(req.params.id), function(err){
				if (err){
					throw err; 
				}else{
					//return to article page to see changes 
					res.redirect('/entries/'+ parseInt(req.params.id));
				}
		});
	}
});

/// render edit page for comments 

app.get('/entries/:entryId/comments/:id/edit',function(req,res){
	var entryID = parseInt(req.params.entryId);
	var commentID = parseInt(req.params.id);
	db.get("SELECT * FROM comments WHERE id = ?", commentID, function (err, row){ 
		if(err){ throw err;
		}else{ 
		res.render('commentedit.ejs',{comment:row, entryID:entryID});
		}
	});
});

//update an comment edit and redirecting back to entry page 
app.put('/entries/:entryId/comments/:id',function(req,res){
	var entryID = parseInt(req.params.entryId);
	var commentID = parseInt(req.params.id);
	db.run("UPDATE comments SET user = ?, note =? WHERE id = ?", req.body.user, req.body.note, commentID, function(err){
		if(err){
			throw err; 
		}else{
				console.log(entryID);
				res.redirect('/entries/'+ entryID);
		}
	});
});

// deleting a post 
app.delete('/entries/:id',function(req,res){
	db.run("DELETE FROM entries WHERE id = "+ parseInt(req.params.id), function(err){
		//check on entry list for changes
		res.redirect('/entries');
	});
});

// deleting a comment 
app.delete('/entries/:entryId/comments/:id',function(req,res){
	db.run("DELETE FROM comments WHERE id ="+parseInt(req.params.id), function(err){
		res.redirect('/entries/'+parseInt(req.params.entryId));
	});
});


app.listen(3000, function(){
	console.log("listening on "+3000);
});



