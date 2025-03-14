import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Formik, Form, Field, FieldArray, FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Switch,
  Heading,
  Divider,
  IconButton,
  NumberInput,
  NumberInputField,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Text,
  Flex,
  useColorModeValue,
  Tooltip,
  SimpleGrid,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons';
import { campaignApi, countryApi } from '../../services/api';
import { CampaignFormData, Country } from '../../types';
// import { formatNumber, formatEUR } from '../../utils/formatters';

// Validation schema for the campaign form
const CampaignSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  landingPageUrl: Yup.string().url('Must be a valid URL').required('Landing page URL is required'),
  payouts: Yup.array()
    .of(
      Yup.object().shape({
        countryId: Yup.number().required('Country is required'),
        amount: Yup.number()
          .typeError('Amount must be a number')
          .required('Amount is required'),
        budget: Yup.number()
          .typeError('Budget must be a number')
          .required('Budget is required'),
        budgetAlertEmail: Yup.string()
          .email('Must be a valid email')
          .when('budgetAlert', {
            is: true,
            then: (schema) => schema.required('Email is required when budget alert is enabled'),
          }),
      })
    )
    .min(1, 'At least one payout must be added'),
});

// Initial values for a new campaign
const initialValues: CampaignFormData = {
  title: '',
  landingPageUrl: '',
  isRunning: false,
  payouts: [
    {
      countryId: undefined as unknown as number,
      amount: 0,
      budget: 0,
      autoStop: false,
      budgetAlert: false,
      budgetAlertEmail: '',
    },
  ],
};

const CampaignForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const [formValues, setFormValues] = useState<CampaignFormData>(initialValues);

  // Color mode values
  const outlineBtnBorderColor = useColorModeValue('brand.500', 'white');
  const outlineBtnColor = useColorModeValue('brand.500', 'white');
  const outlineBtnHoverBg = useColorModeValue('brand.50', 'rgba(255, 255, 255, 0.1)');
  const outlineBtnHoverBorderColor = useColorModeValue('brand.600', 'white');
  const outlineBtnHoverColor = useColorModeValue('brand.600', 'white');
  
  const cancelBtnBorderColor = useColorModeValue('gray.200', 'white');
  const cancelBtnColor = useColorModeValue('gray.700', 'white');
  const cancelBtnHoverBg = useColorModeValue('gray.50', 'rgba(255, 255, 255, 0.1)');
  const cancelBtnHoverBorderColor = useColorModeValue('gray.300', 'white');
  const cancelBtnHoverColor = useColorModeValue('gray.800', 'white');

  const stickyColumnBg = useColorModeValue('white', 'gray.800');

  // Fetch countries for dropdown
  const { data: countries, isLoading: isLoadingCountries } = useQuery(
    'countries',
    countryApi.getAll
  );

  // Fetch campaign data if in edit mode
  const {
    isLoading: isLoadingCampaign,
    isError,
  } = useQuery(
    ['campaign', id],
    () => campaignApi.getById(Number(id)),
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        // Transform campaign data to form values
        const formData: CampaignFormData = {
          title: data.title,
          landingPageUrl: data.landingPageUrl,
          isRunning: Boolean(data.isRunning), // Explicit boolean conversion
          payouts: data.payouts.map((payout) => ({
            id: payout.id,
            // Use the explicit countryId property now available from the backend
            countryId: payout.countryId || payout.country?.id || 0,
            amount: payout.amount,
            budget: payout.budget,
            autoStop: Boolean(payout.autoStop), // Explicit boolean conversion
            budgetAlert: Boolean(payout.budgetAlert), // Explicit boolean conversion
            budgetAlertEmail: payout.budgetAlertEmail || '',
          })),
        };
        setFormValues(formData);
      },
    }
  );

  // Create campaign mutation
  const createMutation = useMutation(campaignApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('campaigns');
      toast({
        title: 'Campaign created',
        description: 'New campaign has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/campaigns');
    },
    onError: (error: string) => {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Update campaign mutation
  const updateMutation = useMutation(
    (data: CampaignFormData) => campaignApi.update(Number(id), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
        queryClient.invalidateQueries(['campaign', id]);
        toast({
          title: 'Campaign updated',
          description: 'Campaign has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/campaigns');
      },
      onError: (error: string) => {
        toast({
          title: 'Error',
          description: error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  // Submit handler
  const handleSubmit = (values: CampaignFormData) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoadingCampaign || isLoadingCountries) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (isError && isEditMode) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load campaign data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
      </Heading>

      <Formik
        initialValues={isEditMode ? formValues : initialValues}
        validationSchema={CampaignSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <VStack spacing={6} align="start" width="100%">
              {/* Title and URL in side-by-side layout on larger screens */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl isInvalid={!!errors.title && touched.title}>
                  <FormLabel htmlFor="title">Campaign Title</FormLabel>
                  <Field
                    as={Input}
                    id="title"
                    name="title"
                    placeholder="Enter campaign title"
                  />
                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.landingPageUrl && touched.landingPageUrl}>
                  <FormLabel htmlFor="landingPageUrl">Landing Page URL</FormLabel>
                  <Field
                    as={Input}
                    id="landingPageUrl"
                    name="landingPageUrl"
                    placeholder="https://example.com/landing-page"
                  />
                  <FormErrorMessage>{errors.landingPageUrl}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isRunning" mb="0">
                  Campaign Status
                </FormLabel>
                <Field name="isRunning">
                  {({ field, form }: FieldProps) => (
                    <Switch
                      id="isRunning"
                      isChecked={field.value === true}
                      colorScheme="green"
                      onChange={(e) => {
                        form.setFieldValue("isRunning", e.target.checked);
                      }}
                    />
                  )}
                </Field>
                <Text ml={2}>
                  {values.isRunning ? 'Active' : 'Inactive'}
                </Text>
              </FormControl>

              <Divider />

              <VStack width="100%" align="start" spacing={4}>
                <Heading size="md">Payouts by Country</Heading>
                
                <FieldArray name="payouts">
                  {({ push, remove }) => (
                    <Box width="100%">
                      <Box overflowX="auto" maxWidth="100%">
                        <Table variant="simple" mb={4} size={{ base: "sm", md: "md" }}>
                          <Thead>
                            <Tr>
                              <Th position={{ base: "sticky", md: "relative" }} left={0} bg={stickyColumnBg} zIndex={1}>Country</Th>
                              <Th>
                                <Flex align="center">
                                  Amount
                                  <Tooltip 
                                    label="The payout amount per conversion for this country" 
                                    placement="top" 
                                    hasArrow
                                  >
                                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                  </Tooltip>
                                </Flex>
                              </Th>
                              <Th>
                                <Flex align="center">
                                  Budget
                                  <Tooltip 
                                    label="The maximum budget allocated for this country's campaign" 
                                    placement="top" 
                                    hasArrow
                                  >
                                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                  </Tooltip>
                                </Flex>
                              </Th>
                              {/* <Th>Auto Stop</Th> */}
                              <Th display={{ base: "none", md: "table-cell" }}>Budget Alert</Th>
                              <Th position={{ base: "sticky", md: "relative" }} right={0} bg={stickyColumnBg} zIndex={1}>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {values.payouts.map((_, index) => (
                              <Tr key={index}>
                                <Td>
                                  <FormControl isInvalid={
                                    !!(errors.payouts?.[index] as any)?.countryId && 
                                    (touched.payouts?.[index] as any)?.countryId
                                  }>
                                    <Field
                                      as={Select}
                                      name={`payouts.${index}.countryId`}
                                    >
                                      {countries?.map((country: Country) => (
                                        <option key={country.id} value={country.id}>
                                          {country.name} ({country.code})
                                        </option>
                                      ))}
                                    </Field>
                                    <FormErrorMessage>
                                      {(errors.payouts?.[index] as any)?.countryId}
                                    </FormErrorMessage>
                                  </FormControl>
                                </Td>
                                <Td>
                                  <FormControl isInvalid={
                                    !!(errors.payouts?.[index] as any)?.amount && 
                                    (touched.payouts?.[index] as any)?.amount
                                  }>
                                    <Field name={`payouts.${index}.amount`}>
                                      {({ field, form }: FieldProps) => (
                                        <NumberInput
                                          {...field}
                                          isValidCharacter={(val) => /^[0-9.-]$/.test(val)} 
                                          min={0}
                                          precision={2}
                                          step={1}
                                          allowMouseWheel={false}
                                          value={field.value === null || field.value === undefined ? '' : field.value}
                                          onChange={(valueString) => {
                                            // Remove any non-numeric characters except decimal point
                                            valueString = valueString.replace(/[^0-9.]/g, '');
                                            form.setFieldValue(field.name, valueString === '' ? 0 : Number(valueString));
                                          }}
                                        >
                                          <NumberInputField 
                                            placeholder="0.00" 
                                            onFocus={(e) => e.target.select()}
                                          />
                                        </NumberInput>
                                      )}
                                    </Field>
                                    <FormErrorMessage>
                                      {(errors.payouts?.[index] as any)?.amount}
                                    </FormErrorMessage>
                                  </FormControl>
                                </Td>
                                <Td>
                                  <FormControl isInvalid={
                                    !!(errors.payouts?.[index] as any)?.budget && 
                                    (touched.payouts?.[index] as any)?.budget
                                  }>
                                    <Field name={`payouts.${index}.budget`}>
                                      {({ field, form }: FieldProps) => (
                                        <NumberInput
                                          {...field}
                                          isValidCharacter={(val) => /^[0-9.-]$/.test(val)}
                                          min={0}
                                          precision={2}
                                          step={1}
                                          allowMouseWheel={false}
                                          value={field.value === null || field.value === undefined ? '' : field.value}
                                          onChange={(valueString) => {
                                            // Remove any non-numeric characters except decimal point
                                            valueString = valueString.replace(/[^0-9.]/g, '');
                                            form.setFieldValue(
                                              field.name,
                                              valueString === '' ? 0 : Number(valueString)
                                            );
                                          }}
                                        >
                                          <NumberInputField 
                                            placeholder="0.00" 
                                            onFocus={(e) => e.target.select()}
                                          />
                                        </NumberInput>
                                      )}
                                    </Field>
                                    <FormErrorMessage>
                                      {(errors.payouts?.[index] as any)?.budget}
                                    </FormErrorMessage>
                                  </FormControl>
                                </Td>
                                {/* <Td>
                                  <Field
                                    as={Switch}
                                    name={`payouts.${index}.autoStop`}
                                    colorScheme="red"
                                  />
                                </Td> */}
                                <Td display={{ base: "none", md: "table-cell" }}>
                                  <Flex direction="row" alignItems="center" height="90px" width="100%" gap={3}>
                                    {/* Toggle switch */}
                                    <Box>
                                      <Field name={`payouts.${index}.budgetAlert`}>
                                        {({ field, form }: FieldProps) => (
                                          <Switch
                                            id={`payouts.${index}.budgetAlert`}
                                            isChecked={field.value === true}
                                            colorScheme="orange"
                                            onChange={(e) => {
                                              form.setFieldValue(`payouts.${index}.budgetAlert`, e.target.checked);
                                              // If toggled off, clear the email field
                                              if (!e.target.checked) {
                                                form.setFieldValue(`payouts.${index}.budgetAlertEmail`, '');
                                              }
                                            }}
                                          />
                                        )}
                                      </Field>
                                    </Box>
                                    
                                    {/* Email input field */}
                                    {/*values.payouts[index].budgetAlert && */ (
                                      <FormControl 
                                        isInvalid={
                                          !!(errors.payouts?.[index] as any)?.budgetAlertEmail && 
                                          (touched.payouts?.[index] as any)?.budgetAlertEmail
                                        }
                                        flex="1"
                                      >
                                        <Field
                                          as={Input}
                                          name={`payouts.${index}.budgetAlertEmail`}
                                          placeholder="this.feature@wip.dev"
                                          size="sm"
                                        />
                                        <FormErrorMessage mt={1} fontSize="xs">
                                          {(errors.payouts?.[index] as any)?.budgetAlertEmail}
                                        </FormErrorMessage>
                                      </FormControl>
                                    )}
                                  </Flex>
                                </Td>
                                <Td>
                                  <IconButton
                                    aria-label="Remove payout"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    size="sm"
                                    isDisabled={values.payouts.length === 1}
                                    onClick={() => remove(index)}
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>

                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="brand"
                          variant="outline"
                          onClick={() =>
                            push({
                              countryId: 0,
                              amount: 0,
                              budget: 0,
                              autoStop: false,
                              budgetAlert: false,
                              budgetAlertEmail: '',
                            })
                          }
                          mb={8}
                          borderColor={outlineBtnBorderColor}
                          color={outlineBtnColor}
                          _hover={{
                            bg: outlineBtnHoverBg,
                            borderColor: outlineBtnHoverBorderColor,
                            color: outlineBtnHoverColor
                          }}
                        >
                          Add Payout
                        </Button>
                      </Box>
                    </Box>
                  )}
                </FieldArray>
              </VStack>

              <Divider />

              <HStack spacing={4} width="100%" justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/campaigns')}
                  borderColor={cancelBtnBorderColor}
                  color={cancelBtnColor}
                  _hover={{
                    bg: cancelBtnHoverBg,
                    borderColor: cancelBtnHoverBorderColor,
                    color: cancelBtnHoverColor
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                >
                  {isEditMode ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </HStack>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default CampaignForm;