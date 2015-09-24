var express    = require("express");
var bodyParser = require("body-parser");
var fs         = require("fs");
var path       = require("path");

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
app.route("/").get(function (request, response) {

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
app.route("/echo").post(function (request, response) {
	var contents = request.body.contents;

	response.send(contents);
});

/*
 * Test page for Join
 * */
app.route("/join").get(function (request, response) {
	fs.readFile("join.html", function(error, data) {
		response.send(data.toString());
	});
});

/*
 * Member Join
 * */
app.route("/join").post(function (request, response) {

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

	pool.query(script, function (error, rows, fields) {
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

				pool.query(script, function (error, rows, fileds) {
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
app.route("/login").get(function (request, response) {
	fs.readFile("join.html", function (error, data) {
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

	pool.query(script, function (error, rows, fields) {
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
app.route("/assignObject").get(function (request, response) {
	fs.readFile("assignObject.html", function(error, data) {
		response.send(data.toString());
	});
});

/*
 * Assign Obejct
 * */
app.route("/assignObject").post(function (request, response) {
	var email    = pool.escape(request.body.email);
	var obj_name = pool.escape(request.body.obj_name); 

	// Result
	var result = {
		obj_id: null,
		error: null
	};

	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Object insertion request has been occured");
	console.log("	Owner:" + email);
	console.log("	OName:" + obj_name);

	var script = "SELECT * FROM OBJECT WHERE "
		+ "EMAIL="    + email    + " AND "
		+ "OBJ_NAME=" + obj_name + ";";

	pool.query(script, function (error, rows, fields) {
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
 * Assign Lost Object
 *
 * Note that this part will be accpeted by arduino.
 * Therfore we'll not going to send JSON data to it.
 */
app.route("/report").get(function (request, response) {
	response.sendFile(path.join(__dirname + "/report.html"));
});

app.route("/report").post(function (request, response) {
	// Log
	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Object report has been occured");
	console.log("	objId:" + request.body.obj_id);
	console.log("	locId:" + request.body.loc_id);

	// Generate Query
	var script = "SELECT * FROM LOST WHERE "
		+ "OBJ_ID=" + request.body.obj_id + " AND "
		+ "LOC_ID=" + request.body.loc_id + ";";

	// Process Query
	pool.query(script, function (error, rows, fields) {
		if(error != null) {
			console.log(error);
			response.send("RETURN_1");
		} else {
			if(rows == "") {
				// Generate Query
				script = "INSERT INTO LOST (LOC_ID, OBJ_ID) VALUES ("
					+ request.body.loc_id + ", "
					+ request.body.obj_id + ");";

				// Process Query
				pool.query(script, function (error, rows, fields) {
					if(error != null) {
						console.log(error);
						response.send("RETURN_1");
					} else {
						response.send("RETURN_0");
					}
				});
			} else {
				response.send("RETURN_0");
			}
		}
	});
});

/*
 * Get Object List
 */
app.route("/objList").get(function (request, response) {
	response.sendFile(path.join(__dirname + "/objList.html"));
});

app.route("/objList").post(function (request, response) {
	// Log
	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Object search request has been occured");
	console.log("	Owner:" + request.body.email);

	var result = {
		data: null,
		error: null
	};

	// Security Check
	var email = pool.escape(request.body.email);

	// Generate Query
	var script = "SELECT * FROM USER WHERE "
		+ "EMAIL=" + email + ";";

	// Process Query
	pool.query(script, function (error, rows, fields) {
		// Error Check
		if(error != null) {
			// Trace Error
			console.log(error);
			result["error"] = error;
			response.send(JSON.stringify(result));
		} else {
			// Check the existence of user
			if(rows == "") {
				// No such user
				response.send(result);
			} else {
				script = "SELECT OBJ_NAME, LOST_TIME, LOC_NAME "
					+ "FROM OBJECT "
					+ "LEFT JOIN LOST ON LOST.OBJ_ID = OBJECT.OBJ_ID "
					+ "LEFT JOIN LOCATION ON LOST.LOC_ID = LOCATION.LOC_ID "
					+ "WHERE EMAIL=" + email + ";";

				pool.query(script, function (error, rows, fields) {
					if(error != null) {
						// Trace Error
						console.log(error);
						result["error"] = error;
					} else {
						result["data"] = rows;
					}
					response.send(JSON.stringify(result));
				});
			}
		}
	});
});

/*
	Delete Object from Lost List
*/
app.route("/delete").get(function (request, response) {
	response.sendFile(path.join(__dirname + "/delete.html"));
});

app.route("/delete").post(function (request, response) {
	var obj_id = request.body.obj_id; 

	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Lost object remove request has been occured");
	console.log("	obj_id:" + obj_id);

	var script = "SELECT * FROM LOST WHERE "
		+ "OBJ_ID=" + obj_id + ";";

	pool.query(script, function (error, rows, fields) {
		// Check Error
		if(error != null) {
			// Error
			console.log(error);
		
			// End Transaction
			response.send("RETURN_1");
		} else {
			// Check duplication
			if(rows != "") {
				// Create query
				script = "DELETE FROM LOST WHERE OBJ_ID = " + obj_id + ";";

				// Insert and get the auto increment number
				pool.query(script, function(error, rows, fields) {
					// End Transaction
					response.send("RETURN_0");
				});
			}
			else {
				// There is already such object
				console.log("	There is no such object");
		
				// End Transaction
				response.send("RETURN_0");
			}
		}
	});
});

/*
 * Admin Page : To handle the location info
*/
app.route("/secret").get(function (request, response) {
	response.sendFile(path.join(__dirname + "/location.html"));
});

app.route("/secret").post(function (request, response) {
	// Security Check
	var email    = request.body.email;
	var password = request.body.password;
	var loc_name = pool.escape(request.body.loc_name);

	// Log
	console.log("*----*----*----*----*----*----*----*----*-----*");
	console.log("Location insertion request has been occured");
	console.log("	Location Name:" + loc_name);

	// Chedck Admin ID & Password
	if(email == "__ADMIN_MODE__" && password == "arduinojs") {
		var script = "SELECT * FROM LOCATION WHERE "
			+ "LOC_NAME=" + loc_name + ";";

		pool.query(script, function (error, rows, fields) {
			if(error != null) {
				// Error Trace
				console.log(error);
				response.send("MYSQL ERROR\n" + error);
			} else {
				// Check Duplication
				if(rows == "") {
					//
					script = "INSERT INTO LOCATION (LOC_NAME) "
						+ "VALUES (" + loc_name + ");";

					pool.query(script, function (error, rows, fields) {
						if(error != null) {
							console.log(error);
							response.send("MYSQL ERROR\n" + error);
						} else {
							response.send("LOC_ID = " + rows.insertId);
						}
					});
				} else {
					response.send("ALREADY EXIST");
				}
			}
		});
	} else {
		response.send("ACCESS DENIED");
	}
});

/*
 * Open the Server
 * */
var server = app.listen(3000, function() {
	var host = server.address().addres;
	var port = server.address().port;
});
