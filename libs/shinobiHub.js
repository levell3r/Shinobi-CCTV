var fs = require('fs')
var request = require('request')
module.exports = function(s,config,lang,app,io){
    if(config.shinobiHubEndpoint === undefined){config.shinobiHubEndpoint = `https://hub.shinobi.video/`}else{config.shinobiHubEndpoint = s.checkCorrectPathEnding(config.shinobiHubEndpoint)}
    var stripUsernameAndPassword = function(string,username,password){
        if(username)string = string.split(username).join('_USERNAME_')
        if(password)string = string.split(password).join('_PASSWORD_')
        return string
    }
    var validatePostConfiguration = function(fields){
        var response = {ok: true}
        var fieldsJson
        if(!fields.json)fields.json = '{}'
        try{
            fieldsJson = JSON.parse(fields.json)
        }catch(err){
            response.ok = false
            response.msg = ('Configuration is not JSON format.')
        }
        if(!fields.details)fields.details = '{}'
        try{
            fieldsDetails = JSON.parse(fields.details)
        }catch(err){
            fieldsDetails = {}
        }
        if(
          fields.name === '' ||
          fields.brand === '' ||
          fields.json === ''
        ){
            response.ok = false
            response.msg = ('The form is incomplete.')
        }
        if(!fields.description)fields.description = ''
        if(!fieldsJson.mid){
            response.ok = false
            response.msg = ('The monitor configuration is incomplete.')
        }
        var monitorDetails = s.parseJSON(fieldsJson.details)
        fieldsJson.details = monitorDetails || {}

        fieldsJson.details.auto_host = stripUsernameAndPassword(fieldsJson.details.auto_host,fieldsJson.details.muser,fieldsJson.details.mpass)
        fieldsJson.path = stripUsernameAndPassword(fieldsJson.path,fieldsJson.details.muser,fieldsJson.details.mpass)
        fieldsJson.details.muser = '_USERNAME_'
        fieldsJson.details.mpass = '_PASSWORD_'

        response.json = JSON.stringify(fieldsJson)
        response.details = JSON.stringify(fieldsDetails)
        return response
    }
    const uploadConfiguration = (shinobiHubApiKey,type,monitorConfig,callback) => {
        var validated = validatePostConfiguration({
            json: JSON.stringify(monitorConfig)
        })
        if(validated.ok === true){
            request.post({
                url: `${config.shinobiHubEndpoint}api/${shinobiHubApiKey}/postConfiguration`,
                form: {
                    "type": type,
                    "brand": monitorConfig.ke,
                    "name": monitorConfig.name,
                    "description": "Backup at " + (new Date()),
                    "json": validated.json,
                    "details": JSON.stringify({
                        // maybe ip address?
                    })
                }
            }, function(err,httpResponse,body){
                callback(err,s.parseJSON(body) || {ok: false})
            })
        }else{
            callback(new Error(validated.msg),{ok: false})
        }
    }
    const onMonitorSave = async (monitorConfig,form) => {
        if(config.shinobiHubAutoBackup === true && config.shinobiHubApiKey){
            uploadConfiguration(config.shinobiHubApiKey,'cam',monitorConfig,() => {
                // s.userLog({ke:monitorConfig.ke,mid:'$USER'},{type:lang['Websocket Connected'],msg:{for:lang['Superuser'],id:cn.mail,ip:cn.ip}})
            })
        }
        if(s.group[monitorConfig.ke] && s.group[monitorConfig.ke].init.shinobihub === '1'){
            uploadConfiguration(s.group[monitorConfig.ke].init.shinobihub_key,'cam',monitorConfig,() => {
                // s.userLog({ke:monitorConfig.ke,mid:'$USER'},{type:lang['Websocket Connected'],msg:{for:lang['Superuser'],id:cn.mail,ip:cn.ip}})
            })
        }
    }
    s.onMonitorSave(onMonitorSave)
}
