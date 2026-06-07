import api from './api'
export const getClasses = () => api.get('/classes').then(response => {
  if (response.data && response.data.data) {
    const order = [
      "petite section",
      "moyenne section",
      "grande section",
      "sil",
      "cp",
      "ce1",
      "ce2",
      "cm1",
      "cm2",
      "6ème", "6eme",
      "5ème", "5eme",
      "4ème", "4eme",
      "3ème", "3eme",
      "2nde",
      "1ère", "1ere",
      "terminale", "tle"
    ];
    response.data.data.sort((a, b) => {
      const aName = (a.libelle || "").toLowerCase();
      const bName = (b.libelle || "").toLowerCase();
      
      // Look for an exact match or substring match
      let idxA = order.findIndex(o => aName.includes(o));
      let idxB = order.findIndex(o => bName.includes(o));
      
      // If not found in the custom order list, push to the end
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      
      if (idxA !== idxB) return idxA - idxB;
      return aName.localeCompare(bName);
    });
    
    // In case there is response.data.classes as well
    if (response.data.classes) {
        response.data.classes = response.data.data;
    }
  }
  return response;
});
export const createClass  = (data)    => api.post('/classes', data)
export const updateClass  = (id, data)=> api.put(`/classes/${id}`, data)
export const deleteClass  = (id)      => api.delete(`/classes/${id}`)

export const getCycles =  ()        => api.get('/cycles')
export const createCycle  = (data)    => api.post('/cycles', data)
export const updateCycle  = (id, data)=> api.put(`/cycles/${id}`, data)
export const deleteCycle  = (id)      => api.delete(`/cycles/${id}`)

export const getSalles =  ()        => api.get('/salles')
export const createSalle  = (data)    => api.post('/salles', data)
export const updateSalle  = (id, data)=> api.put(`/salles/${id}`, data)
export const deleteSalle  = (id)      => api.delete(`/salles/${id}`)
