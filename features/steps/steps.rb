When('I log the page source') do
  $logger.info Maze.driver.page_source
end

When("I click the element named {string}") do |element_name|
  elements = Maze.driver.find_elements(:name, element_name)
  $logger.info elements.inspect
end
