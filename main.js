const {app, BrowserWindow, ipcMain, dialog, shell, Menu} = require('electron');
const request = require('request');
const cheerio = require('cheerio');
const cryptr = require('cryptr');
const notifier = require('node-notifier');
/*Load Datastores*/
var Datastore = require('nedb')
, settings = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/settings.db'})
, logindb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/login.db'})
, attdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/att.db'})
, pdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/p.db'})
, ffdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/ff.db'})
, odb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/o.db'})
, padb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/pa.db'})
, mdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/m.db'})
, gdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/g.db'})
, sdb = new Datastore({ filename: app.getPath('appData')+'/webkiosk/data/settings/s.db'});
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

let loginScreen, mainScreen;

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
			/*{
				label: 'Change Password',
				click: function(menuItem, BrowserWindow, event){
					
				}
			},*/
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
				label: ' Full History',
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
				label: 'Datesheet',
				click: function(menuItem, BrowserWindow, event){

				}
			},
			{
				label: 'Seating Plan',
				click: function(menuItem, BrowserWindow, event){

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
	request('https://api.github.com/repos/ngudbhav/Webkiosk-Wrapper/releases/latest', {headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 '}}, function(error, html, body){
		if(!error){
			var v = app.getVersion().replace(' ', '');
			if(JSON.parse(body).tag_name){
				var latestV = JSON.parse(body).tag_name.replace('v', '');
				var changeLog = JSON.parse(body).body.replace('<strong>Changelog</strong>', 'Update available. Here are the changes:\n');
				if(latestV!=v){
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
					notifier.notify(
					{
						appName: "NGUdbhav.webkiosk",
						title: 'Update Available',
						message: 'A new version is available. Click to open browser and download.',
						icon: path.join(__dirname, 'images', 'logo.ico'),
						sound: true,
						wait:true
					});
					notifier.on('click', function(notifierObject, options) {
						shell.openExternal('https://github.com/ngudbhav/Webkiosk-Wrapper/releases/latest');
					});
				}
				else{
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
			mainScreen.webContents.send('updateCheckup', null);
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
			mainScreen.webContents.send('updateCheckup', null);
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
			logindb.remove({}, { multi: true });
			createLoginScreen();
			//clear db and load the login screen
		}
		else{
			if(results.length){
				results[0].saved = true;
				//fallback = true;
				login(results[0]);
			}
			else{
				logindb.remove({}, { multi: true });
				createLoginScreen();
			}
		}
	});
	var menuBuild = Menu.buildFromTemplate(mainScreenMenu);
	Menu.setApplicationMenu(menuBuild);
}
function createLoginScreen(){
	loginScreen = new BrowserWindow({width: 1000, height: 600, webPreferences: {
		nodeIntegration: true
	}});
	loginScreen.loadFile(path.join(__dirname, 'views', 'login.html'));
	//loginScreen.openDevTools();
	loginScreen.setMenu(null);
	loginScreen.on('closed', function(){
		loginScreen = null;
	});
}
function createMainScreen(){
	mainScreen = new BrowserWindow({width: 1100, height: 600, webPreferences: {
		nodeIntegration: true
	}});
	mainScreen.loadFile(path.join(__dirname, 'views', 'main.html'));
	mainScreen.openDevTools();
	mainScreen.on('closed', function(){
		mainScreen = null;
	});
	mainScreen.webContents.on('did-finish-load', () => {
		logindb.find({}, function(error, results){
			if(error) throw error;
			else{
				settings.find({}, function(error, name){
					if(error) throw error;
					else{
						mainScreen.webContents.send('name', {name:name[0].name, fallback:fallback});
					}
				});
				if(results[0].password[0] == '#' || results[0].password[0] == '&'){
					mainScreen.webContents.send('parentalLoginStatus', {status:1});
					getAttendance();
					getInfo();
					getFullInfo();
					getOnlineInfo();
					getPA();
					getGrades();
					getMarks();
					getSubjects();
					checkUpdates();
				}
				else{
					mainScreen.webContents.send('parentalLoginStatus', {status:0});
				}
			}
		});
	});
}
var headers = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
	'Content-Type' : 'application/x-www-form-urlencoded'
}
var fallback= false;
var loginStatus = 0;
/*APIS for actions in the menu bar*/
function getAttendance(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudentAttendanceList.jsp", headers:headers}, function(error, httpResponse, body){
		if(error){
			attdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].attendance){
						mainScreen.webContents.send('attendanceSummary', results[0].attendance);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getAttendance();
			}
			else{
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
				mainScreen.webContents.send('attendanceSummary', {subjects:subjects, lect_and_tut:lect_and_tut, lect:lect, tut:tut, prac:prac});
				attdb.remove({}, {multi:true});
				attdb.insert({attendance:{subjects:subjects, lect_and_tut:lect_and_tut, lect:lect, tut:tut, prac:prac, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getInfo(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/StudentFiles/PersonalFiles/StudPersonalInfo.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			pdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].info){
						mainScreen.webContents.send('info', results[0].info);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getInfo();
			}
			else{
				var $ = cheerio.load(body);
				var tr = [];
				$("table[cellpadding='2']>tbody").children('tr').each(function(i, item){
					if(i !==0 && i!==7 && i!==9 && i<12){
						tr.push($(this).children('td').eq(1).html());
					}
				});
				mainScreen.webContents.send('info', {data:tr});
				pdb.remove({}, {multi:true});
				pdb.insert({info:{data:tr, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getFullInfo(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/FAS/StudRegFee.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			ffdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].fullInfo){
						mainScreen.webContents.send('fullInfo', results[0].fullInfo);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getFullInfo();
			}
			else{
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
				mainScreen.webContents.send('fullInfo', {sem:sem, feesAmount:feesAmount, paid:paid, dues:dues});
				ffdb.remove({}, {multi:true});
				ffdb.insert({fullInfo:{sem:sem, feesAmount:feesAmount, paid:paid, dues:dues, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getOnlineInfo(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/pgfiles/OnlinePaymentHistory.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			odb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].onlineInfo){
						mainScreen.webContents.send('onlineInfo', results[0].onlineInfo);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getOnlineInfo();
			}
			else{
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
				mainScreen.webContents.send('onlineInfo', {sem:sem, feesAmount:feesAmount, paid:paid, trxn:trxn, status:status});
				odb.remove({}, {multi:true});
				odb.insert({onlineInfo:{sem:sem, feesAmount:feesAmount, paid:paid, trxn:trxn, status:status, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getPA(){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudCGPAReport.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			padb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].pa){
						mainScreen.webContents.send('pa', results[0].pa);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getPA();
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
				mainScreen.webContents.send('pa', {sem:sem, credit:credit, sg:sg, cg:cg});
				padb.remove({}, {multi:true});
				padb.insert({pa:{sem:sem, credit:credit, sg:sg, cg:cg, date:new Date()}}, function(error, results){
					if(error) throw error;
				});
			}
		}
	});
}

function getMarks(e){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventMarksView.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			mdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].marks){
						mainScreen.webContents.send('marks', results[0].marks);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getMarks(e);
			}
			else{
				var $ = cheerio.load(body);
				let val = $("select[name='exam']").children('option').eq(1).attr('value');
				if(e){
					val= e;
				}
				else{
					let option = [];
					$("select[name='exam']").children('option').each(function(i, item){
						var t = $(this).html();
						if(t[0] == '2'){
							option.push(t);
						}
					});
					mainScreen.webContents.send('switch', {option:option, type:'marks'});
				}
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventMarksView.jsp?x=&exam='+val, headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
						$ = cheerio.load(body);
						var thead = $("#table-1>thead").children('tr').html();
						var tr = [];
						$("#table-1>tbody").children('tr').each(function(i, item){
							tr.push($(this).html());
						});
						mainScreen.webContents.send('marks', {thead:thead, tr:tr});
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
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventGradesView.jsp', headers:headers}, function(error, httpResponse, body){
		if(error){
			gdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].grade){
						mainScreen.webContents.send('grade', results[0].grade);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getGrades(e);
			}
			else{
				var $ = cheerio.load(body);
				let val = $("select[name='exam']").children('option').eq(1).attr('value');
				if(e){
					val = e;
				}
				else{
					let option = [];
					$("select[name='exam']").children('option').each(function(i, item){
						var t = $(this).html();
						if(t[0] == '2'){
							option.push(t);
						}
					});
					mainScreen.webContents.send('switch', {option:option, type:'grades'});
				}
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url: 'https://webkiosk.jiit.ac.in/StudentFiles/Exam/StudentEventGradesView.jsp?x=&exam='+val, headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
						$ = cheerio.load(body);
						var course = [];
						var grade = [];
						$("#table-1>tbody").children('tr').each(function(i, item){
							course.push($(this).children('td').eq(1).html());
							grade.push($(this).children('td').eq(3).html());
						});
						mainScreen.webContents.send('grade', {course:course, grade:grade});
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
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudSubjectFaculty.jsp", headers:headers}, function(error, httpResponse, body){
		if(error){
			sdb.find({}, function(error, results){
				if(error) throw error;
				else{
					if(results[0].faculty){
						mainScreen.webContents.send('faculty', results[0].faculty);
					}
				}
			});
			//ECONNREFUSED
			//getaddrinfo
			console.log(error);
			/*if('session timeout'){
				//relogin(getattendance);
				login();
				getAttendance();
			}*/
		}
		else{
			if(body.includes('Session Timeout')){
				createWindow();
				getSubjects(e);
			}
			else{
				var $ = cheerio.load(body);
				let option = [];
				$("select[name='exam']").children('option').each(function(i, item){
					var t = $(this).html();
					if(t[0] == '2'){
						option.push(t);
					}
				});
				if(e){
					option[option.length-1] = e;
				}
				else{
					mainScreen.webContents.send('switch', {option:option, type:'faculty'});
				}
				console.log(option);
				request({secureProtocol: 'TLSv1_method', strictSSL: false, url:"https://webkiosk.jiit.ac.in/StudentFiles/Academic/StudSubjectFaculty.jsp?x=&exam="+option[option.length-1], headers:headers}, function(error, httpResponse, body){
					if(error) throw error;
					else{
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
						mainScreen.webContents.send('faculty', {subject:subject, lecture:lecture, tutorial:tutorial, practical:practical});
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
		logindb.insert({enroll: item.enroll, dob:item.dob, password:item.password}, function(error, results){
			if(error){
				throw new Error('There seems to be a problem in reading your login data. Please login again.');
				clear();
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
	else{
		
	}
}

function login(data){
	request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in', headers: headers}, function(error, response, body){
		if(error){
			if(data.saved){
				loginStatus = 1;
				fallback = true;
				checkLoginStatus(data);
			}
			else{
				throw error;
			}
		}
		else{
			var cookie = response.headers['set-cookie'];
			var $ = cheerio.load(body);
			var captcha = $('font[face="casteller"]').html();
			headers.Cookie = cookie;
			request.post({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/CommonFiles/UseValid.jsp', form: {txtInst:"Institute", InstCode:"JIIT", txtuType:"Member Type", UserType101117:"S", txtCode:"Enrollment No", MemberCode:data.enroll, DOB:"DOB", DATE1:data.dob, txtPin:"Password/Pin", Password101117:data.password, BTNSubmit:"Submit", txtCode:"Enter Captcha     ", txtcap:captcha}, headers: headers}, function(error,httpResponse,body){
				if(error){
					console.log(error);
				}
				else{
					//Invalid password case here
					if(httpResponse.rawHeaders[5].split('=')[1]){
						console.log(httpResponse.rawHeaders[5].split('=')[1]);
						loginStatus = httpResponse.rawHeaders[5].split('=')[1];
						return ;
					}
					else{
						request({secureProtocol: 'TLSv1_method', strictSSL: false, url:'https://webkiosk.jiit.ac.in/StudentFiles/StudentPage.jsp', headers:headers}, function(error, response, body){
							if(error){
								console.log(error);
							}
							else{
								if(body.includes('FrameLeftStudent')){
									//Success Login
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
					/*https://webkiosk.jiit.ac.in/StudentFiles/StudentPage.jsp*/
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
	logout();
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
	login(item);
	settings.remove({}, {multi:true});
	settings.insert({name: item.name}, function(error, results){
		if(error) throw error;
	});
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