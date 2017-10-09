

const Shared = require('mmap-object')
//const shared_object = new Shared.Create('deletefile')

//shared_object['new_key'] = 'some value'
//shared_object.new_property = 'some other value'
////shared_object.close()
//
//
//for(var i = 0; i<2048; i++){
//	shared_object[i] = 'some value'
//}

const read_only_shared_object = new Shared.Open('deletefile');



