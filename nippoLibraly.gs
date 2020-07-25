var line_endpoint_reply = 'https://api.line.me/v2/bot/message/reply';
var line_endpoint_profile = 'https://api.line.me/v2/bot/profile'
var CHANNEL_ACCESS_TOKEN = NippoConst.getChannelAccessToken();

var MESSAGE_CAL_DID = 0;
var MESSAGE_CAL_ALREADY = 1;
var MESSAGE_CAL_WILL = 2;
var MESSAGE_CAL_REST = 3;

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
  if(message == MESSAGE_ARG_ALREADY){reply_text = findMessage(MESSAGE_CAL_ALREADY)};
  if(message == MESSAGE_ARG_WILL){reply_text = findMessage(MESSAGE_CAL_WILL)};
  if(message == MESSAGE_SRG_REST){reply_text = findMessage(MESSAGE_CAL_REST)};
  
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
  
}

function pushMessage() {
  var usersId = findUsersId();
  
  for (const userId of usersId) {
    
    if(canNotSend(userId)){
      return;
    }
    
    var text = findMessage(MESSAGE_CAL_DID);
    
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

function canNotSend(userId){
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
