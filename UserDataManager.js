const fs = require('fs');
module.exports = function UserDataManager(filepath){
    this.filepath;
    this.data = {
        book: null,
        chapter: null,
        time: null,
        volume: null
    };

    this.init = async function(filepath){
        try {
            this.filepath = filepath;
            let rawdata = await fs.readFileSync(filepath);
            this.data = JSON.parse(rawdata);
        } catch(e){
            console.error(e);
            let data = JSON.stringify(this.data);
            await fs.writeFileSync(filepath, data);
        }
    }

    this.get_data = function(){
        return this.data;
    }

    this.set_data = function(obj){
        Object.assign(this.data, obj);
        let data = JSON.stringify(this.data);
        fs.writeFile(this.filepath, data, function(){
                
        });
    }
}