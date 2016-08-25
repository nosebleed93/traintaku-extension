bridge = {
    sendImageList: function(imageList){
        console.log('sending data', imageList)
        document.dispatchEvent(new CustomEvent('traintakuReceiveImages', {imageList: imageList}))
    }
};