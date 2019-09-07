const {app, BrowserWindow, ipcMain, dialog, shell, Menu} = require('electron');
const request = require('request');
const cheerio = require('cheerio');
const notifier = require('node-notifier');
/*Load Datastores*/
var Datastore = require('nedb')
, settings = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/settings.db'})
, logindb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/login.db'})
, attdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/att.db'})
, pdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/p.db'})
, ffdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/ff.db'})
, odb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/o.db'})
, padb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/pa.db'})
, mdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/m.db'})
, gdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/g.db'})
, sdb = new Datastore({ filename: app.getPath('appData')+'/wrapper/data/settings/s.db'});
settings.loadDatabase();
logindb.loadDatabase();
attdb.loadDatabase();
pdb.loadDatabase();
ffdb.loadDatabase();
odb.loadDatabase();
padb.loadDatabase();
mdb.loadDatabase();
gdb.loadDatabase();
sdb.loadDatabase();
var path = require('path');
//Variable to confirm the availability to seating plan
var planAvailable=0;

let loginScreen, mainScreen;
let image;
if (process.platform === 'darwin') {
	image = path.join(__dirname, 'icons', 'mac', 'app.icns');
}
else{
	image = path.join(__dirname, 'icons', 'win', 'app.ico');
}
//Creating the menu bar
var mainScreenMenu = [
	{
		label: 'Account',
		submenu: [
			{
				label: 'Home',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'home');
				}
			},
			{
				label: 'My info',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'info');
				}
			},
			{
				label: 'Logout and remove data',
				click: function(menuItem, BrowserWindow, event){
					dialog.showMessageBox(
						{
							type: 'info',
							buttons:['Yes', 'No'],
							title: 'Logout and clear everything?',
							detail: 'This will log you out of webkiosk and clear everything stored on this PC. Software may restart. You will still be able to log back in. Do you want to continue?',
						}, function(response){
							if(response === 0){
								clear();
							}
						}
					);
				}
			},
			{
				label: 'Close',
				role: 'quit'
			}
		]
	},
	{
		label: 'Fees',
		submenu: [
			{
				label: 'Full History',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'full');
				}
			},
			{
				label: 'Online History',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'online');
				}
			}

		]
	},
	{
		label: 'Academic Info',
		submenu: [
			{
				label: 'Attendance Summary',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'attSummary');
				}
			},
			{
				label: 'View Subjects/Faculties',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'faculty');
				}
			}
		]
	},
	{
		label: 'Exam Info',
		submenu:[
			{
				label: 'Seating Plan',
				click: function(menuItem, BrowserWindow, event){
					//Check if seating plan is actually available or not
					if (planAvailable === 0){
						dialog.showMessageBox({
							type: 'info',
							buttons: ['Close'],
							title: 'No data available!',
							detail: 'No Datesheet available. Probably there is ample of time for exams.'
						});
					}
					else{
						//If available then proceed to render
						mainScreen.webContents.send('windowShift', 'seat');
					}
				}
			},
			{
				label: 'Marks',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'marks');
				}
			},
			{
				label: 'Grades',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'grade');
				}
			},
			{
				label: 'View CGPA/SGPA',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.webContents.send('windowShift', 'cg');
				}
			}
		]
	},
	{
		label: 'Chrome mode',
		submenu:[
			{
				label: 'Start',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.loadURL('https://webkiosk.jiit.ac.in');
				}
			},
			{
				label: 'Stop',
				click: function(menuItem, BrowserWindow, event){
					mainScreen.loadFile('views/main.html');
				}
			}
		]
	}
];

/*Update checkup start*/
function checkUpdates(e){
	//Check for the latest release with github release page
	request('https://api.github.com/repos/ngudbhav/Webkiosk-Wrapper/releases/latest', {headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 '}}, function(error, html, body){
		if(!error){
			var v = app.getVersion().replace(' ', '');
			if(JSON.parse(body).tag_name){
				var latestV = JSON.parse(body).tag_name.replace('v', '');
				var changeLog = JSON.parse(body).body;
				//If version mismatch
				if(latestV!=v){
					//Present the dialog
					dialog.showMessageBox(
						{
							type: 'info',
							buttons:['Open Browser to download link', 'Close'],
							title: 'Update Available',
							detail: changeLog,
						}, function(response){
							if(response === 0){
								shell.openExternal('https://github.com/ngudbhav/Webkiosk-Wrapper/releases/latest');
							}
						}
					);
					//Present the notification
					notifier.notify(
					{
						appName: "NGUdbhav.webkiosk",
						title: 'Update Available',
						message: 'A new version is available. Click to open browser and download.',
						icon: path.join(__dirname, 'icons', 'win', 'app.ico'),
						sound: true,
						wait:true
					});
					notifier.on('click', function(notifierObject, options) {
						shell.openExternal('https://github.com/ngudbhav/Webkiosk-Wrapper/releases/latest');
					});
				}
				else{
					//If clicked on check for updates
					if(e === 'f'){
						dialog.showMessageBox({
							type: 'info',
							buttons:['Close'],
							title: 'No update available!',
							detail: 'You already have the latest version installed.'
						});
					}
				}
			}
			if(mainScreen){
				mainScreen.webContents.send('updateCheckup', null);
			}
			else if(loginScreen){
				loginScreen.webContents.send('updateCheckup', null);
			}
		}
		else{
			if(e === 'f'){
				dialog.showMessageBox({
					type: 'error',
					buttons:['Close'],
					title: 'Update check failed!',
					detail: 'Failed to connect to the update server. Please check your internet connection'
				});
			}
			if(mainScreen){
				mainScreen.webContents.send('updateCheckup', null);
			}
			else if(loginScreen){
				loginScreen.webContents.send('updateCheckup', null);
			}
		}
	});
}
ipcMain.on('update', function(e, item){
	checkUpdates('f');
});
/*Update checkup end*/

function createWindow(){
	logindb.find({}, function(error, results){
		if(error){
			console.log(error);
			//Clear the previous saved credentials and delete saved user data
			logindb.remove({}, { multi: true });
			createLoginScreen();
			//clear db and load the login screen
		}
		else{
			if(results.length){
				results[0].saved = true;
				//fallback = true;
				//Proceed to login with the saved credentials
				login(results[0]);
			}
			else{
				//Clear the previous saved credentials and delete saved user data
				logindb.remove({}, { multi: true });
				createLoginScreen();
			}
		}
	});
}
function createLoginScreen(){
	//Create login screen
	loginScreen = new BrowserWindow({width: 1000, height: 600, icon: image, webPreferences: {
		nodeIntegration: true
	}});
	loginScreen.loadFile(path.join(__dirname, 'views', 'login.html'));
	//loginScreen.openDevTools();
	loginScreen.setMenu(null);
	//No need of menu
	loginScreen.removeMenu();
	Menu.setApplicationMenu(Menu.buildFromTemplate([]));
	loginScreen.on('closed', function(){
		loginScreen = null;
	});
}
function createMainScreen(){
	//Create after login screen
	mainScreen = new BrowserWindow({width: 1100, height: 600, icon:image, webPreferences: {
		nodeIntegration: true
	}});
	mainScreen.loadFile(path.join(__dirname, 'views', 'main.html'));
	var menuBuild = Menu.buildFromTemplate(mainScreenMenu);
	Menu.setApplicationMenu(menuBuild);
	mainScreen.on('closed', function(){
		mainScreen = null;
	});
	mainScreen.webContents.on('did-finish-load', () => {
		//Retrieve user data and send the name to the title bar
		logindb.find({}, function(error, results){
			if(error) throw error;
			else{
				settings.find({}, function(error, name){
					if(error) throw error;
					else{
						mainScreen.webContents.send('name', {name:name[0].name});
					}
				});
				if(results[0].password[0] == '#' || results[0].password[0] == '&'){
					//Check for password reset. Very trivial Confirmation. Need confirmation
					mainScreen.webContents.send('parentalLoginStatus', {status:1});
				}
				else{
					mainScreen.webContents.send('parentalLoginStatus', {status:0});
				}
				//Call all the APIs to retrieve full webkiosk data of the user
				!mainScreen || getAttendance();
				!mainScreen || getInfo();
				!mainScreen || getFullInfo();
				!mainScreen || getOnlineInfo();
				!mainScreen || getPA();
				!mainScreen || getGrades();
				!mainScreen || getMarks();
				!mainScreen || getSubjects();
				!mainScreen || checkUpdates();
				!mainScreen || getPlan();
			}
		});
	});
}
var headers = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
	'Content-Type' : 'application/x-www-form-urlencoded'
}
//This headers will be used to authenticate every request with webkiosk.
//After login, The cookie is inserted into the headers and every request is made with new headers.
var fallback= false;
var loginStatus = 0;
/*APIS for actions in the menu bar*/
function getAttendance(){
	//Request for attendance
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudentAttendanceList.jsp", headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			attdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].attendance){
						if(mainScreen){
							mainScreen.webContents.send('attendanceSummary', results[0].attendance);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getAttendance();
				//again try to retrieve the data
			}
			else{
				//Scrapping the attendance from the webpage
				var $ = cheerio.load(body);
				var subjects = [];
				var lect_and_tut = [];
				var lect = [];
				var tut = [];
				var prac = [];
				$('#table-1>tbody>tr').each(function(i, item){
					subjects.push($(this).children('td').eq(1).html());
					if($(this).children('td').eq(2).children('a')!=undefined){
						lect_and_tut.push($(this).children('td').eq(2).children('a').html());
					}
					else{
						lect_and_tut.push('NA');
					}
					if($(this).children('td').eq(3).children('a')!=undefined){
						lect.push($(this).children('td').eq(3).children('a').children('font').html());
					}
					else{
						lect.push('NA');
					}
					if($(this).children('td').eq(4).children('a')!=undefined){
						tut.push($(this).children('td').eq(4).children('a').html());
					}
					else{
						tut.push('NA');
					}
					if($(this).children('td').eq(5).children('a')!=undefined){
						prac.push($(this).children('td').eq(5).children('a').html());
					}
					else{
						prac.push('NA');
					}
				});
				if(mainScreen){
					//Send the results to the render
					mainScreen.webContents.send('attendanceSummary', {subjects:subjects, lect_and_tut:lect_and_tut, lect:lect, tut:tut, prac:prac});
				}
				//Remove the previous attendance data and save the new attendance record
				attdb.remove({}, {multi:true});
				attdb.insert({attendance:{subjects:subjects, lect_and_tut:lect_and_tut, lect:lect, tut:tut, prac:prac, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getPlan(e){
	//Request for Seating plan
	request({ secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudViewSeatPlan.jsp', headers: headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Seating plan should not be cached
			console.log(error);
		}
		else{
			if (body.includes('Session Timeout')) {
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getPlan();
				//again try to retrieve the data
			}
			else {
				//checking for availability
				var $ = cheerio.load(body);
				var checkIfAvailable = $("#DScode>option");
				if(checkIfAvailable){
					//if available then start scrapping
					var op = checkIfAvailable.val();
					request({ secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudViewSeatPlan.jsp?x=&DScode='+op, headers: headers }, function(error, httpResponse, body){
						if(error) throw body;
						else{
							var $ = cheerio.load(body);
							var subjects = [];
							var dateTime = [];
							var room = [];
							var seat = [];
							$("#table-1").children('tbody').children('tr').each(function(i, item){
								subjects.push($(this).children('td').eq(1).html());
								dateTime.push($(this).children('td').eq(2).children('font').html());
								room.push($(this).children('td').eq(3).html());
								seat.push($(this).children('td').eq(4).html());
							});
							if(subjects.length!==0){
								planAvailable = 1;
								if (mainScreen) {
									mainScreen.webContents.send('seating', { subjects: subjects, dateTime: dateTime, room: room, seat: seat });
								}
							}
							else{
								planAvailable = 0;
							}
						}
					});
				}
			}
		}
	});
}

function getInfo(){
	//Request for Personal Information
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/StudentFiles/PersonalFiles/StudPersonalInfo.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			pdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].info){
						if(mainScreen){
							mainScreen.webContents.send('info', results[0].info);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getInfo();
				//again try to retrieve the data
			}
			else{
				//Scrapping the Personal data from the webpage
				var $ = cheerio.load(body);
				var tr = [];
				$("table[cellpadding='2']>tbody").children('tr').each(function(i, item){
					if(i !==0 && i!==7 && i!==9 && i<12){
						tr.push($(this).children('td').eq(1).html());
					}
				});
				if(mainScreen){
					//Send the results to the render
					mainScreen.webContents.send('info', {data:tr});
				}
				//Remove the previous data and save the new record
				pdb.remove({}, {multi:true});
				pdb.insert({info:{data:tr, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getFullInfo(){
	//Request for full fees paid information
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/FAS/StudRegFee.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			ffdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].fullInfo){
						if(mainScreen){
							mainScreen.webContents.send('fullInfo', results[0].fullInfo);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getFullInfo();
				//again try to retrieve the data
			}
			else{
				//Scrapping
				var $ = cheerio.load(body);
				var sem = [];
				var feesAmount = [];
				var paid = [];
				var dues = [];
				$("#table-1>tbody").children('tr').each(function(i, item){
					if(i<8){
						sem.push($(this).children('td').eq(0).html());
						feesAmount.push($(this).children('td').eq(2).html());
						paid.push($(this).children('td').eq(4).html());
						dues.push($(this).children('td').eq(5).html());
					}
				});
				if(mainScreen){
					//Send the results to the render
					mainScreen.webContents.send('fullInfo', {sem:sem, feesAmount:feesAmount, paid:paid, dues:dues});
				}
				//Remove the previous data and save the new record
				ffdb.remove({}, {multi:true});
				ffdb.insert({fullInfo:{sem:sem, feesAmount:feesAmount, paid:paid, dues:dues, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getOnlineInfo(){
	//Request to get the online fees paid history
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/pgfiles/OnlinePaymentHistory.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			odb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].onlineInfo){
						if(mainScreen){
							mainScreen.webContents.send('onlineInfo', results[0].onlineInfo);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getOnlineInfo();
				//again try to retrieve the data
			}
			else{
				//Scrapping
				var $ = cheerio.load(body);
				var sem = [];
				var feesAmount = [];
				var paid = [];
				var trxn = [];
				var status = [];
				$("table>tbody").children('tr').each(function(i, item){
					if(i>=2){
						sem.push($(this).children('td').eq(1).html());
						feesAmount.push($(this).children('td').eq(3).html());
						paid.push($(this).children('td').eq(4).html());
						trxn.push($(this).children('td').eq(5).html());
						status.push($(this).children('td').eq(7).html());
					}
				});
				if(mainScreen){
					//Send the results to the render
					mainScreen.webContents.send('onlineInfo', {sem:sem, feesAmount:feesAmount, paid:paid, trxn:trxn, status:status});
				}
				//Remove the previous data and save the new record
				odb.remove({}, {multi:true});
				odb.insert({onlineInfo:{sem:sem, feesAmount:feesAmount, paid:paid, trxn:trxn, status:status, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getPA(){
	//Request to get the CGPA and SGPA record of every semester
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudCGPAReport.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			padb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].pa){
						if(mainScreen){
							mainScreen.webContents.send('pa', results[0].pa);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getPA();
				//again try to retrieve the data
			}
			else{
				var $ = cheerio.load(body);
				var sem = [];
				var credit = [];
				var sg = [];
				var cg = [];
				$("#table-1>tbody").children('tr').each(function(i, item){
					sem.push($(this).children('td').eq(0).html());
					credit.push($(this).children('td').eq(2).html());
					sg.push($(this).children('td').eq(6).html());
					cg.push($(this).children('td').eq(7).html());
				});
				if(mainScreen){
					//Send the results to the render
					mainScreen.webContents.send('pa', {sem:sem, credit:credit, sg:sg, cg:cg});
				}
				//Remove the previous data and save the new record
				padb.remove({}, {multi:true});
				padb.insert({pa:{sem:sem, credit:credit, sg:sg, cg:cg, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getMarks(e){
	//Get the marks of the current semester. If unavailable, will render the record of the last semester
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventMarksView.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			mdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].marks){
						if(mainScreen){
							mainScreen.webContents.send('marks', results[0].marks);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getMarks(e);
				//again try to retrieve the data
			}
			else{
				//Get the latest records available on webkiosk
				var $ = cheerio.load(body);
				let val = $("select[name='exam']").children('option').eq(1).attr('value');
				if(e){
					//If user called marks for particular semester
					val= e;
				}
				else{
					//If no action from user
					let option = [];
					$("select[name='exam']").children('option').each(function(i, item){
						var t = $(this).html();
						if(t[0] == '2'){
							option.push(t);
						}
					});
					if(mainScreen){
						mainScreen.webContents.send('switch', {option:option, type:'marks'});
					}
				}
				//Request for marks of particular semester in the 'val' variable.
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventMarksView.jsp?x=&exam='+val, headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
						//Scrapping
						$ = cheerio.load(body);
						var thead = $("#table-1>thead").children('tr').html();
						var tr = [];
						$("#table-1>tbody").children('tr').each(function(i, item){
							tr.push($(this).html());
						});
						if(mainScreen){
							//Send the results to the render
							mainScreen.webContents.send('marks', {thead:thead, tr:tr});
						}
						//Remove previous data and save the new data.
						mdb.remove({}, {multi:true});
						mdb.insert({marks:{thead:thead, tr:tr, date:new Date()}}, function(error, results){
							if(error) throw error;
						});
					}
				});
			}
		}
	});
}

function getGrades(e){
	//Get the grades of the current semester. If unavailable, will render the record of the last semester
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventGradesView.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			gdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].grade){
						if(mainScreen){
							mainScreen.webContents.send('grade', results[0].grade);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getGrades(e);
				//again try to retrieve the data
			}
			else{
				//Get the latest records available on webkiosk
				var $ = cheerio.load(body);
				let val = $("select[name='exam']").children('option').eq(1).attr('value');
				if(e){
					//If user called grades for particular semester
					val = e;
				}
				else{
					//If no action from user
					let option = [];
					$("select[name='exam']").children('option').each(function(i, item){
						var t = $(this).html();
						if(t[0] == '2'){
							option.push(t);
						}
					});
					if(mainScreen){
						mainScreen.webContents.send('switch', {option:option, type:'grades'});
					}
				}
				//Request for grades of particular semester in the 'val' variable.
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventGradesView.jsp?x=&exam='+val, headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
						//Scrapping
						$ = cheerio.load(body);
						var course = [];
						var grade = [];
						$("#table-1>tbody").children('tr').each(function(i, item){
							course.push($(this).children('td').eq(1).html());
							grade.push($(this).children('td').eq(3).html());
						});
						if(mainScreen){
							//Send the results to the render
							mainScreen.webContents.send('grade', {course:course, grade:grade});
						}
						//Remove previous data and save the new data
						gdb.remove({}, {multi:true});
						gdb.insert({grade:{course:course, grade:grade, date:new Date()}}, function(error, results){
							if(error) throw error;
						});
					}
				});
			}
		}
	});
}

function getSubjects(e){
	//Get the subjects of the current semester. If unavailable, will render the record of the last semester
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudSubjectFaculty.jsp", headers:headers}, function(error, httpResponse, body){
		if(error){
			//Network connection failure
			//Load the previously saved data from the system
			sdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].faculty){
						if(mainScreen){
							mainScreen.webContents.send('faculty', results[0].faculty);
						}
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
		}
		else{
			if(body.includes('Session Timeout')){
				//If session times out
				createWindow();
				//Login again with the already saved credentials in background
				getSubjects(e);
				//again try to retrieve the data
			}
			else{
				//Get the latest records available on webkiosk
				var $ = cheerio.load(body);
				let option = [];
				$("select[name='exam']").children('option').each(function(i, item){
					var t = $(this).html();
					if(t[0] == '2'){
						option.push(t);
					}
				});
				if(e){
					//If user called subjects for particular semester
					option[option.length-1] = e;
				}
				else{
					if(mainScreen){
						mainScreen.webContents.send('switch', {option:option, type:'faculty'});
					}
				}
				//Request for subjects of particular semester in the 'option'.
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudSubjectFaculty.jsp?x=&exam="+option[option.length-1], headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
						//Scrapping
						$ = cheerio.load(body);
						var subject = [];
						var lecture = [];
						var tutorial = [];
						var practical = [];
						$("table[align='middle']>tbody").children('tr').each(function(i, item){
							if(i!=0){
								subject.push($(this).children('td').eq(1).html());
								lecture.push($(this).children('td').eq(2).html());
								tutorial.push($(this).children('td').eq(3).html());
								practical.push($(this).children('td').eq(4).html());
							}
						});
						if(mainScreen){
							//Send the results to the render
							mainScreen.webContents.send('faculty', {subject:subject, lecture:lecture, tutorial:tutorial, practical:practical});
						}
						//Remove previous data and save the new data
						sdb.remove({}, {multi:true});
						sdb.insert({faculty:{subject:subject, lecture:lecture, tutorial:tutorial, practical:practical, date:new Date()}}, function(error, results){
							if(error) throw error;
						});
					}
				});
			}
		}
	});
}
/*APIS end*/

function checkLoginStatus(item){
	if(loginStatus === 1){
		//If the credentails are correct, then save the login data into the webkiosk.
		logindb.insert({enroll: item.enroll, dob:item.dob, password:item.password, college: item.college}, function(error, results){
			if(error){
				clear();
				throw new Error('There seems to be a problem in reading your login data. Please login again.');
			}
			else{
				if(!mainScreen){
					createMainScreen();
				}
				if(loginScreen){
					loginScreen.close();
				}
				//Login creds saved
				//Load main screen
			}
		});
		//Login success
	}
}

function login(data){
	//Get the cookie from the webkiosk and save the cookie to authenticate future requests.
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in', headers: headers}, function(error, response, body){
		if(error){
			//Network connection failure
			//Virtual login with the previous data.
			if(data.saved){
				loginStatus = 1;
				fallback = true;
				checkLoginStatus(data);
			}
			else{
				if(error.code === 'ENOTFOUND'){
					dialog.showErrorBox('Failed to login', 'Webkiosk is inaccessible. Probably, you are not connected to internet. Failed to login.');
					loginScreen.webContents.send('failure', '');
				}
				else{
					dialog.showErrorBox('Failed to login', 'Webkiosk is Down! Can not login. Please try again later.');
					loginScreen.webContents.send('failure', '');
				}
			}
		}
		else{
			var cookie = response.headers['set-cookie'];
			var $ = cheerio.load(body);
			var captcha = $('font[face="casteller"]').html();
			headers.Cookie = cookie;
			//Cookies overwritten
			//Submit the login form with the data from the user.
			request.post({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/CommonFiles/UseValid.jsp', form: {txtInst:"Institute", InstCode:data.college, txtuType:"Member Type", UserType101117:"S", txtCode:"Enrollment No", MemberCode:data.enroll, DOB:"DOB", DATE1:data.dob, txtPin:"Password/Pin", Password101117:data.password, BTNSubmit:"Submit", txtCode:"Enter Captcha     ", txtcap:captcha}, headers: headers}, function(error,httpResponse,body){
				if(error){
					console.log(error);
				}
				else{
					//Invalid password case here
					if(body.includes('Invalid Password')){
						loginStatus = httpResponse.rawHeaders[5].split('=')[1];
						dialog.showErrorBox('Authentication Error', 'Webkiosk reports that these credentials are invalid. Please make sure not to try the 3rd time before making sure!');
						loginScreen.webContents.send('failure', 'NA');
						return;
					}
					if(httpResponse.rawHeaders[5].split('=')[1]){
						loginStatus = httpResponse.rawHeaders[5].split('=')[1];
						if(httpResponse.rawHeaders[5].split('=')[1].includes('Date')){
							dialog.showErrorBox('Authentication Error', 'Webkiosk reports that these credentials are invalid. Please make sure not to try the 3rd time before making sure!');
							loginScreen.webContents.send('failure', 'NA');
						}
						return ;
					}
					else{
						//Furthur redirect from webkiosk
						request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/StudentFiles/StudentPage.jsp', headers:headers}, function(error, response, body){
							if(error){
								console.log(error);
							}
							else{
								if(body.includes('FrameLeftStudent')){
									//Success Login reported
									loginStatus = 1;
									checkLoginStatus(data);
								}
								else{
									console.log('Undefined error');
									loginStatus = 'Undefined error';
									return 0;
								}
							}
						});
					}
				}
			});
		}
	});
}
//Logging out not working

function logout(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/CommonFiles/SignOut.jsp', headers:headers}, function(error, res, body){
		if(error) throw error;
		else{
			console.log(body);
		}
	});
}

function clear(){
	//Clear the full data
	logindb.remove({}, { multi: true });
	settings.remove({}, { multi: true });
	attdb.remove({}, { multi: true });
	pdb.remove({}, { multi: true });
	ffdb.remove({}, { multi: true });
	odb.remove({}, { multi: true });
	padb.remove({}, { multi: true });
	mdb.remove({}, { multi: true });
	gdb.remove({}, { multi: true });
	sdb.remove({}, { multi: true });
	app.relaunch();
	app.exit(0);
}

app.on('ready', ()=>{
	createWindow();
});
app.on('window-all-closed', function(){
	if(process.platform!=='darwin'){
		app.quit();
	}
});
app.on('activate', function(){
	if(loginScreen===null){
		createWindow();
	}
});

ipcMain.on('login',function(e, item){
	if(item.enroll && item.name && item.dob && item.password){
		login(item);
		settings.remove({}, {multi:true});
		settings.insert({name: item.name}, function(error, results){
			if(error) throw error;
		});
	}
	else{
		dialog.showErrorBox('Incomplete data', 'Please Fill all details.');
		loginScreen.webContents.send('failure', '');
	}
});
ipcMain.on('faculty', function(e, item){
	getSubjects(item);
});
ipcMain.on('grades', function(e, item){
	getGrades(item);
});
ipcMain.on('marks', function(e, item){
	getMarks(item);
});