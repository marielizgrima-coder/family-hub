let loading = false;

async function saveRecipe(recipe) {
    if (loading) {
        alert('Please wait, saving in progress...');
        return;
    }
    
    loading = true;
    console.log('Saving recipe:', recipe);
    
    try {
        // Code to save the recipe to Firebase
        await firebase.database().ref('recipes').push(recipe);
        
        console.log('Recipe saved successfully!');
        alert('Recipe saved successfully!');
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe. Please try again.');
    } finally {
        loading = false;
    }
}