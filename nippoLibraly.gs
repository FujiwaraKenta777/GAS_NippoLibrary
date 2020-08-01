var line_endpoint_reply = 'https://api.line.me/v2/bot/message/reply';
var line_endpoint_profile = 'https://api.line.me/v2/bot/profile'
var CHANNEL_ACCESS_TOKEN = NippoConst.getChannelAccessToken();

var MESSAGE_CAL_DID = 0;
var MESSAGE_CAL_ALREADY = 1;
var MESSAGE_CAL_WILL = 2;
var MESSAGE_CAL_REST = 3;
var MESSAGE_CAL_REMINDER = 4;

var MESSAGE_ARG_ALREADY = "送った";
var MESSAGE_ARG_WILL = "これから";
var MESSAGE_SRG_REST = "今日は休み";

// webhook で POST された json を処理して、レスポンスを作成し、api経由で返信する
function doPost(e) {
  
  var event = JSON.parse(e.postData.contents).events[0];
  var userId = event.source.userId;
  var timestamp = event.timestamp;
  
  //followイベント（新規登録、ブロック解除時）でユーザ登録する
  if ( event.type == 'follow' ) {
    var name = findUserName(userId);
    addUser(userId, name);
    addLog(event);
    return;
  }
  
  // 返信用トークン
  var reply_token= event.replyToken;
  
  var reply_text = "";
  
  var message = event.message.text;
  if(message == MESSAGE_ARG_ALREADY){reply_text = findRandomMessage(MESSAGE_CAL_ALREADY)};
  if(message == MESSAGE_ARG_WILL){reply_text = findRandomMessage(MESSAGE_CAL_WILL)};
  if(message == MESSAGE_SRG_REST){reply_text = findRandomMessage(MESSAGE_CAL_REST)};
  
  if(existReplyHistory(userId)){reply_text = 'もう聞いたよ'};
  
  // 返信内容 trimで最終行の改行文字を削除する
  var messages = [{
    'type': 'text',
    'text': reply_text
  }];
  
  UrlFetchApp.fetch(line_endpoint_reply, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages
    })
  });
  
  addHistory(userId, new Date(timestamp), message);
  addLog(event);
  clearReminderCount(userId);
  
}

function pushMessage() {
  var users = findUsers();
  
  for (const user of users) {
    
    var userId = user[0];
    var reminderCount = user[2];
    
    if(canNotSend(userId)){
      return;
    }
    
    var text = "";
    
    if(reminderCount > 0){
      //同じ行の確認メッセージと催促メッセージを取得する  
      var messageRow = getRandomMessageRow();
      var didMessage =  findMessage(MESSAGE_CAL_DID, messageRow);
      var reminderMessage =  findMessage(MESSAGE_CAL_REMINDER, messageRow);
      
      [...Array(reminderCount)].map(() => text = text + reminderMessage + "\n")
      text = text + didMessage;
      
    } else {
      text =  findRandomMessage(MESSAGE_CAL_DID);
    }
    
    var postData = {
      "to": userId,
      "messages": [{
        "type": "text",
        "text": text,
      }]
    };
    
    var url = "https://api.line.me/v2/bot/message/push";
    var headers = {
      "Content-Type": "application/json",
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    };
    
    var options = {
      "method": "post",
      "headers": headers,
      "payload": JSON.stringify(postData)
    };
    var response = UrlFetchApp.fetch(url, options);
    
    incrementReminderCount(userId);
  }
}

function findUserName(userId){
  
  //ユーザ情報を取得
  var userInfo = UrlFetchApp.fetch(line_endpoint_profile + '/' + userId, {
                                   'headers': {
                                   'Content-Type': 'application/json; charset=UTF-8',
                                   'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
                                   },
                                   'method': 'get',
                                   });
  
  var name = JSON.parse(userInfo).displayName
  
  return name;
}

function isWeekEnd(today){
  //曜日取得
  //getDay() 0は日曜日、1は月曜日、2は火曜日、3は水曜日、4は木曜日、5は金曜日、6は土曜日
  var dayOfWeek = today.getDay();
  if(dayOfWeek <= 0 || dayOfWeek >= 6){
    return true;
  }
  
  //祝日
  //Googleカレンダー「日本の祝日」よりにイベントとして登録されている日を祝日とする
  var japaneseHolidaysCalendars = CalendarApp.getCalendarsByName("日本の祝日");
  var japaneseHolidays = japaneseHolidaysCalendars[0];
  var events = japaneseHolidays.getEventsForDay(today);
  if(events.length > 0){
    return true;
  }
  
  return false; 
}


function testIsWeekEnd(){
  console.log("本日");
  //本日
  console.log(isWeekEnd(new Date()));
  
  console.log("休み");
  //土曜日
  console.log(isWeekEnd(new Date(2020,7,8)));
  //日曜日
  console.log(isWeekEnd(new Date(2020,7,9)));
  //祝日
  console.log(isWeekEnd(new Date(2020,7,10)));
  //祝日（土曜・春分の日）
  console.log(isWeekEnd(new Date(2021,2,20)));
  
  console.log("平日");
  //月曜日
  console.log(isWeekEnd(new Date(2020,7,3)));
  //金曜日
  console.log(isWeekEnd(new Date(2020,7,7)));
}

function canNotSend(userId){
  //休みの日は送らない
  if(isWeekEnd(new Date())){
    return true;
  }
  
  //0:00～18:30は送らない
  var zeroHours = new Date().setHours(0, 0, 0, 0);
  var goHomeHours = new Date().setHours(18, 30, 0, 0);
  if(new Date() > zeroHours && new Date() < goHomeHours){
    return true;
  }
  
  //すでに返事があったら送らない
  if(existReplyHistory(userId)){return true}
  
  //今日まだ「送った」メッセージを貰ってないときは、送る。
  return false;  
  
}
