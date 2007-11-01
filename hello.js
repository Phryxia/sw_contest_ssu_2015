var express    = require("express");
var bodyParser = require("body-parser");
var fs         = require("fs");

/*
 * MySQL Connection
 * */
var mySQL = require("mysql");
var pool  = mySQL.createPool({
	connectionLimit : 10,
	host : "127.0.0.1",
	port : "3306",
	user : "Phryxia",
	password : "a7a02ef6330bb2df03017d81dfdf975f",
	database : "LOSTNFOUND"
});

/*
 * Create an express object
 */
var app = express();
app.use(bodyParser());


/*
 * Default Page
 * */
app.route("/").get(function(request, response) {

	console.log("Host name : " + request.hostname);
	console.log("IP        : " + request.ip);

	response.send("Hello World!");
});

/*
 * Tutorial for our members
 *
 * Please send the data as post type with following
 * specification as:
 *
 * contents = "blahblahblah..."
 * */
app.route("/echo").post(function(request, response) {
	var contents = request.body.contents;

	response.send(contents);
});

/*
 * Test page for Join
 * */
app.route("/join").get(function(request, response) {
	fs.readFile("join.html", function(error, data) {
		response.send(data.toString());
	});
});

/*
 * Member Join
 * */
app.route("/join").post(function(request, response) {

	// Log the input data.
	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Member assign request has been occurred");
	console.log("	E-MAIL : " + request.body.email);
	
	// Create Output Object
	var result = {
		isExist: "true",
		error: null
	};

	// Temporary Variable
	var email    = pool.escape(request.body.email);
	var password = pool.escape(request.body.password);

	// Create Query
	var script = "SELECT * FROM USER WHERE "
		+ "EMAIL=" + email + ";";

	pool.query(script, function(error, rows, fields) {
		// Check the error
		if(error != null) {
			// Thre is an error
			console.log(error);
			result["isExist"] = null;
			result["error"] = "MySQL connection error";
			
			// End Transaction
			response.send(JSON.stringify(result));
		}
		else {
			// Check the existence
			if(rows == "") {
				// Insert to DB
				script = "INSERT INTO USER (EMAIL, PASSWORD) VALUES ("
					+ email
					+ ", password(" + password + "));";

				pool.query(script, function(error, rows, fileds) {
					console.log("	Join Accepted");
					result["isExist"] = "false";
			
					// End Transaction
					response.send(JSON.stringify(result));
				});
			}
			else {
				// There is already such member in DB.
				console.log("	Join Failed");
				result["isExist"] = "true";
	
				// End Transaction
				response.send(JSON.stringify(result));
			}
		}
	});	
});

/*
 * Test page for login
 * */
app.route("/login").get(function(request, response) {
	fs.readFile("join.html", function(error, data) {
		response.send(data.toString());
	});
});

app.route("/login").post(function(request, response) {
	// Log Trace
	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Login request has been occurred");
	console.log("	E-mail : " + request.body.email);

	// Result
	var result = {
		isAccepted: "false",
		error: null
	};

	// Temporary Variable
	var email    = pool.escape(request.body.email);
	var password = pool.escape(request.body.password);

	// Search for the data
	var script = "SELECT * FROM USER WHERE "
   		+ "EMAIL=" + email + " AND "
		+ "PASSWORD=password(" + password + ");";	

	pool.query(script, function(error, rows, fields) {
		// Check Error
		if(error != null) {
			
			console.log(error);
			result["isAccepted"] = null;
			result["error"] = "MySQL connection error";
		}
		else {
			// Check the validality
			if(rows == "") {
				// Invalid Access
				console.log("	Access Denied");
				result["isAccepted"] = "false";
			}
			else {
				// Valid Access
				console.log("	Access Accepted");
				result["isAccepted"] = "true";
			}
		}
	
		// End Transaction
		response.send(JSON.stringify(result));
	});
});

/*
 * Test page for assignObject
 * */
app.route("/assignObject").get(function(request, response) {
	fs.readFile("assignObject.html", function(error, data) {
		response.send(data.toString());
	});
});

/*
 * Assign Obejct
 * */
app.route("/assignObject").post(function(request, response) {

	var script;
	var email    = pool.escape(request.body.email);
	var obj_name = pool.escape(request.body.obj_name); 

	// Result
	var result = {
		obj_id: null,
		error: null
	}

	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Object insertion request has been occured");
	console.log("	Owner:" + email);
	console.log("	OName:" + obj_name);

	script = "SELECT * FROM OBJECT WHERE "
		+ "EMAIL="    + email    + " AND "
		+ "OBJ_NAME=" + obj_name + ";";

	pool.query(script, function(error, rows, fields) {
		// Check Error
		if(error != null) {
			// Error
			console.log(error);
			result["error"] = "MySQL connection error";
		
			// End Transaction
			response.send(JSON.stringify(result));
		} else {
			// Check duplication
			if(rows == "") {
				// Create query
				script = "INSERT INTO OBJECT (EMAIL, OBJ_NAME) VALUES ("
					+ email    + ", "
					+ obj_name + ");";

				// Insert and get the auto increment number
				pool.query(script, function(error, rows, fields) {
					console.log("	ObjID:" + rows.insertId);
					result["obj_id"] = rows.insertId;

					// End Transaction
					response.send(JSON.stringify(result));
				});
			}
			else {
				// There is already such object
				console.log("	ObjID:null w/ duplication");
				result["error"] = "There exist such object already";
		
				// End Transaction
				response.send(JSON.stringify(result));
			}
		}
	});
});

/*
 * Open the Server
 * */
var server = app.listen(3000, function() {
	var host = server.address().addres;
	var port = server.address().port;
});