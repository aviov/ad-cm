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
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { campaignApi, countryApi } from '../../services/api';
import { CampaignFormData, Country } from '../../types';

// Validation schema for the campaign form
const CampaignSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  landingPageUrl: Yup.string().url('Must be a valid URL').required('Landing page URL is required'),
  payouts: Yup.array()
    .of(
      Yup.object().shape({
        countryId: Yup.number().required('Country is required'),
        amount: Yup.number()
          .positive('Amount must be positive')
          .required('Amount is required'),
        budget: Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value))
          .positive('Budget must be positive'),
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
      budget: null,
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
          isRunning: data.isRunning,
          payouts: data.payouts.map((payout) => ({
            id: payout.id,
            countryId: payout.country?.id || 0,
            amount: payout.amount,
            budget: payout.budget,
            autoStop: payout.autoStop,
            budgetAlert: payout.budgetAlert,
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
            <VStack spacing={6} align="start">
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

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isRunning" mb="0">
                  Campaign Status
                </FormLabel>
                <Field
                  as={Switch}
                  id="isRunning"
                  name="isRunning"
                  colorScheme="green"
                />
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
                      <Table variant="simple" mb={4}>
                        <Thead>
                          <Tr>
                            <Th>Country</Th>
                            <Th>Amount</Th>
                            <Th>Budget</Th>
                            <Th>Auto Stop</Th>
                            <Th>Budget Alert</Th>
                            <Th>Actions</Th>
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
                                    placeholder="Select country"
                                  >
                                    <option value="">Select country</option>
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
                                        min={0}
                                        precision={2}
                                        step={0.01}
                                        value={field.value === null || field.value === undefined ? '' : field.value}
                                        onChange={(valueString) => {
                                          form.setFieldValue(field.name, parseFloat(valueString) || 0);
                                        }}
                                      >
                                        <NumberInputField placeholder="0.00" />
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
                                        min={0}
                                        precision={2}
                                        step={0.01}
                                        value={field.value === null || field.value === undefined ? '' : field.value}
                                        onChange={(valueString) => {
                                          form.setFieldValue(
                                            field.name,
                                            valueString === '' ? null : parseFloat(valueString)
                                          );
                                        }}
                                      >
                                        <NumberInputField placeholder="Optional" />
                                      </NumberInput>
                                    )}
                                  </Field>
                                  <FormErrorMessage>
                                    {(errors.payouts?.[index] as any)?.budget}
                                  </FormErrorMessage>
                                </FormControl>
                              </Td>
                              <Td>
                                <Field
                                  as={Switch}
                                  name={`payouts.${index}.autoStop`}
                                  colorScheme="red"
                                />
                              </Td>
                              <Td>
                                <VStack align="start" spacing={2}>
                                  <Field
                                    as={Switch}
                                    name={`payouts.${index}.budgetAlert`}
                                    colorScheme="orange"
                                  />
                                  {values.payouts[index].budgetAlert && (
                                    <FormControl isInvalid={
                                      !!(errors.payouts?.[index] as any)?.budgetAlertEmail && 
                                      (touched.payouts?.[index] as any)?.budgetAlertEmail
                                    }>
                                      <Field
                                        as={Input}
                                        name={`payouts.${index}.budgetAlertEmail`}
                                        placeholder="Email for alerts"
                                        size="sm"
                                      />
                                      <FormErrorMessage>
                                        {(errors.payouts?.[index] as any)?.budgetAlertEmail}
                                      </FormErrorMessage>
                                    </FormControl>
                                  )}
                                </VStack>
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
                            budget: null,
                            autoStop: false,
                            budgetAlert: false,
                            budgetAlertEmail: '',
                          })
                        }
                        mb={8}
                      >
                        Add Payout
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </VStack>

              <Divider />

              <HStack spacing={4} width="100%" justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/campaigns')}
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