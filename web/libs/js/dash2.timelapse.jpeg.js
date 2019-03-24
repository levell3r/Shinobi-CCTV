$(document).ready(function(e){
    //Timelapse JPEG Window
    $.timelapseJpeg = {e:$('#timelapsejpeg')}
    $.timelapseJpeg.datepicker = $('#timelapsejpeg_date')
    $.timelapseJpeg.framesContainer = $.timelapseJpeg.e.find('.frames')
    $.timelapseJpeg.frameStrip = $.timelapseJpeg.e.find('.frameStrip')
    $.timelapseJpeg.playBackViewImg = $.timelapseJpeg.e.find('.playBackView img')
    $.timelapseJpeg.monitors=$.timelapseJpeg.e.find('.monitors_list')
    $.timelapseJpeg.datepicker.daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        // startDate: moment().subtract(1, 'days'),
        locale: {
            format: 'YYYY-MM-DD'
        }
    }, function(start, end, label) {
        console.log(start._d.valueOf())
        $.timelapseJpeg.draw(start._d.valueOf())
    })
    $.timelapseJpeg.draw = function(selectedDate){
        var html = ''
        var selectedMonitor = $.timelapseJpeg.monitors.val()
        var apiURL=$.ccio.init('location',$user)+$user.auth_token+'/timelapse/'+$user.ke+'/'+selectedMonitor+'/'+selectedDate
        $.getJSON(apiURL,function(data){
            if(data && data[0]){
                var firstFilename = data[0].filename
                $.timelapseJpeg.frameSelected = firstFilename
                $.timelapseJpeg.playlist = {}
                $.timelapseJpeg.playlistArray = []
                $.each(data.reverse(),function(n,fileInfo){
                    fileInfo.href = apiURL + '/' + fileInfo.filename
                    fileInfo.number = n
                    html += '<div class="frame" data-filename="' + fileInfo.filename + '"><img src="' + fileInfo.href + '"></div>'
                    $.timelapseJpeg.playlist[fileInfo.filename] = fileInfo
                })
                $.timelapseJpeg.playlistArray = data
                $.timelapseJpeg.frameStrip.html(html)
                $.timelapseJpeg.resetFilmStripPositions()
            }else{
                html = lang['No Data']
                $.timelapseJpeg.frameStrip.html(html)
            }
        })
    }
    $.timelapseJpeg.resetFilmStripPositions = function(){
        var numberOfFrames = Object.keys($.timelapseJpeg.playlist).length
        var frameStripWidth = $.timelapseJpeg.frameStrip.width()
        var widthForEachFrame = frameStripWidth / numberOfFrames
        $.timelapseJpeg.frameStrip.find('.frame').css('width',widthForEachFrame)
    }
    $.timelapseJpeg.setPlayBackFrame = function(href){
        $.timelapseJpeg.playBackViewImg[0].src = href
    }
    $.timelapseJpeg.playInterval = 200
    $.timelapseJpeg.play = function(){
        var selectedFrame = $.timelapseJpeg.playlist[$.timelapseJpeg.frameSelected]
        var selectedFrameNumber = $.timelapseJpeg.playlist[$.timelapseJpeg.frameSelected].number
        $.timelapseJpeg.setPlayBackFrame(selectedFrame.href)
        $.timelapseJpeg.e.find('.frameStrip .frame').removeClass('selected')
        $.timelapseJpeg.e.find(`.frameStrip .frame[data-filename="${selectedFrame.filename}"]`).addClass('selected')
        $.timelapseJpeg.playIntervalTimer = setTimeout(function(){
            ++selectedFrameNumber
            var newSelectedFrame = $.timelapseJpeg.playlistArray[selectedFrameNumber]
            if(!newSelectedFrame)return
            $.timelapseJpeg.frameSelected = newSelectedFrame.filename
            $.timelapseJpeg.play()
        },$.timelapseJpeg.playInterval)
    }
    $.timelapseJpeg.destroy = function(){
        $.timelapseJpeg.pause()
        $.timelapseJpeg.frameStrip.empty()
        $.timelapseJpeg.setPlayBackFrame(null)
    }
    $.timelapseJpeg.pause = function(){
        clearTimeout($.timelapseJpeg.playIntervalTimer)
        delete($.timelapseJpeg.playIntervalTimer)
    }
    $.timelapseJpeg.togglePlayPause = function(){
        if($.timelapseJpeg.playIntervalTimer){
            $.timelapseJpeg.pause()
        }else{
            $.timelapseJpeg.play()
        }
    }
    $.timelapseJpeg.e.on('click','.frame',function(){
        $.timelapseJpeg.pause()
        var selectedFrame = $(this).attr('data-filename')
        if(selectedFrame === $.timelapseJpeg.frameSelected){
            return $.timelapseJpeg.togglePlayPause()
        }
        $.timelapseJpeg.frameSelected = selectedFrame
        var href = $.timelapseJpeg.playlist[selectedFrame].href
        $.timelapseJpeg.setPlayBackFrame(href)
    })
    $.timelapseJpeg.e.on('hidden.bs.modal', function (e) {
        $.timelapseJpeg.destroy()
    })
})
