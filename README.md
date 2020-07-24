# 概要
GAS_NippoWebAppのライブラリとして使用する。

メッセージやログを管理しているスプレッドシートのID（SpreadSheetId）と、LineBotのアクセストークン（ChannelAccessToken）をライブラリで導入している。
gitに公開したくない情報だったので。
![readme_2](https://user-images.githubusercontent.com/53109614/88421694-efc40680-ce23-11ea-9815-6505160b51d2.png)

# スプレッドシート
nippoService.gs はスプレッドシート操作メソッドを管理している。
スプレッドシートでは以下のシートがある。
* messageシート

![messageシート](https://user-images.githubusercontent.com/53109614/88423147-4b8f8f00-ce26-11ea-86e9-2827afbbad06.png)

* historysシート

![historysシート](https://user-images.githubusercontent.com/53109614/88423291-872a5900-ce26-11ea-9580-bd21c4002c15.png)

* usersシート

![usersシート](https://user-images.githubusercontent.com/53109614/88423341-98736580-ce26-11ea-9ce9-c265643b9e3f.png)

* logシート

デバッグ用なので適当に
