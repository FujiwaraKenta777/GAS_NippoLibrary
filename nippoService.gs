var SPREAD_SHEET_NAME = 'message';

var line_endpoint_reply = 'https://api.line.me/v2/bot/message/reply';
var line_endpoint_profile = 'https://api.line.me/v2/bot/profile'

var spreadsheet = SpreadsheetApp.openById(NippoConst.getSpreadSheetId());

var MESSAGE_ARG_ALREADY = "送った";
var MESSAGE_ARG_WILL = "これから";
var MESSAGE_SRG_REST = "今日は休み";


function addUser(userId, name){
  //シートに追加する
  var sheet = spreadsheet.getSheetByName('users');
  var low = sheet.getLastRow() + 1;
  
  sheet.getRange(low, 1).setValue(userId);
  sheet.getRange(low, 2).setValue(name);
  
}

function existReplyHistory(userId){
  
  //履歴抽出
  var historysSheet = spreadsheet.getSheetByName('historys');
  var historysValues = historysSheet.getDataRange().getValues();
  
  var midnughtToday = new Date().setHours(0, 0, 0, 0);
  
  //送信先と同じユーザで
  //「送った」か「今日は休み」メッセージが
  //今日送られているか
  for ( var row = 1; row < historysSheet.getLastRow(); row++ ) {
    //送信先と違うユーザのためスルー
    if ( historysValues[row][0] != userId ) {
      continue;
    }
    //返事メッセージでないのでスルー
    if ( historysValues[row][2] != MESSAGE_ARG_ALREADY && historysValues[row][2] != MESSAGE_SRG_REST ) {
      continue;
    }
    //今日の0時以降のメッセージか
    Logger.log(historysValues[row][1] > midnughtToday );
    if ( historysValues[row][1] > midnughtToday ) {
      return true;
    }
  }
  
  //今日まだ返事を貰ってないとき。
  return false;
}

function findMessage(cal){
  // スプレッドシート連携
  var sheet = spreadsheet.getSheetByName('message');
  
  // 全データ（空含む）を2次元配列に読み込み
  var values = sheet.getDataRange().getValues();
  
  var defaultMessageList = []
  
  // row 0 = 1行目はタイトルなので、 row = 1から始める
  for ( var row = 1; row < sheet.getLastRow(); row++ ) {
    if ( values[row][cal] != '' ) {
      defaultMessageList.push(values[row][cal]);
    }
  }
  
  // デフォルトメッセージからランダムに選択
  rndNum = Math.floor(Math.random()*defaultMessageList.length);
  
  return defaultMessageList[rndNum];
}


function addLog(event){
  var sheet = spreadsheet.getSheetByName('log');
  var low = sheet.getLastRow() + 1;
  
  sheet.getRange(low, 1).setValue(event);
  
}

function addHistory(userId, date, message){
  var sheet = spreadsheet.getSheetByName('historys');
  var low = sheet.getLastRow() + 1;
  
  sheet.getRange(low, 1).setValue(userId);
  sheet.getRange(low, 2).setValue(date);
  sheet.getRange(low, 3).setValue(message);
  
}

function findUsersId(){
   //利用ユーザ抽出
  var usersSheet = spreadsheet.getSheetByName('users');
  var usersValues = usersSheet.getDataRange().getValues();
  
  var usersId = [];
  
  for ( var row = 1; row < usersSheet.getLastRow(); row++ ) {
    if ( usersValues[row][0] != '' ) {
      usersId.push(usersValues[row][0]);
    }
  }
  
  return usersId;
}